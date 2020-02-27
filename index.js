const _ = require('lodash')
const path = require('path')
const fs = require('fs')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const commander = require('commander')
const pLimit = require('p-limit')
const rimraf = require('rimraf')
const { compile } = require('./document')

function parse(args) {
  return new commander.Command()
    .option('-p, --purge', 'Purge output directory first')
    .requiredOption('-f, --file <file>', 'Source file')
    .option('-r, --repeat <times>', 'Files to create', 1)
    .option('-o, --outdir <dir>', 'Output directory', 'compiled')
    .option('-n, --name <name>', 'Output file name', '@{basename}-@{id}@{extension}')
    .option('-c, --cmd <cmd>', 'Shell command or script to apply to output')
    .option('--concurrency <concurrency>', 'Maximum concurrent shell commands.', 1)
    .parse(args)
}

async function main(args) {
  const program = parse(args)
  const {
    file,
    name,
    repeat,
    outdir,
    cmd,
    purge,
    concurrency = 1
  } = program

  const limit = pLimit(parseInt(concurrency))

  const resolvedOutdir = path.resolve(outdir)
  if (!file) {
    if (purge) {
      rimraf.sync(resolvedOutdir)
      return
    }

    program.help()
    return
  }

  if (purge) {
    try {
      rimraf.sync(resolvedOutdir + '/*')
    } catch (e) {
      // ignored
    }
  }

  try {
    fs.mkdirSync(resolvedOutdir)
  } catch (e) {
    // ignored
  }

  const { build, options, extension } = compile(file)

  const nameTemplate = name
    ? _.template(name, options)
    : ({ id }) => id.toString() + extension

  const cmdTemplate = cmd
    ? _.template(cmd, options)
    : () => null

  for (let id = 1; id <= repeat; id++) {
    let data = { id }
    const outfile = path.join(resolvedOutdir, nameTemplate(data))
    const outextension = path.extname(outfile)
    const outdirname = path.dirname(outfile)
    const outfilename = path.basename(outfile)
    const outbasename = path.basename(outfile, extension)
    data = {
      id,
      outfile,
      outfilename,
      outdirname,
      outbasename,
      outextension
    }

    const result = build(data)
    fs.writeFileSync(outfile, result)

    const cmdstr = cmdTemplate(data)
    if (cmdstr) {
      limit(() => {
        console.debug(`Running ${cmdstr}`)
        return exec(cmdstr)
      }).catch(reason => console.error(reason))
    }
  }
}

function withTryCatch(fn) {
  return async function (...args) {
    try {
      await fn(...args)
    } catch (e) {
      console.error(e.message)
    }
  }
}

if (module === require.main) {
  const main2 = withTryCatch(main)
  main2(process.argv)
}
