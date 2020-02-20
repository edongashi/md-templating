const Random = require('./random')
const fs = require('fs')
const path = require('path')
const _ = require('lodash')

const cache = {}

function compile(file) {
  const resolvedFile = path.resolve(file)

  if (resolvedFile in cache) {
    return cache[resolvedFile]
  }

  const extension = path.extname(resolvedFile)
  const fileInfo = {
    file: resolvedFile,
    extension,
    dirname: path.dirname(resolvedFile),
    filename: path.basename(resolvedFile),
    basename: path.basename(resolvedFile, extension)
  }

  const options = {
    evaluate: /<\?([\s\S]+?)\?>/g,
    interpolate: /[$@]\{([^\\}]*(?:\\.[^\\}]*)*)\}/g,
    escape: /<\?=([\s\S]+?)\?>/g,
    imports: {
      random: new Random(),
      ...fileInfo,
      include(childPath, data = {}) {
        return compile(path.resolve(fileInfo.dirname, childPath)).build(data)
      }
    }
  }

  const build = _.template(fs.readFileSync(resolvedFile, 'utf8'), options)
  return {
    build,
    options,
    ...fileInfo
  }
}

module.exports = {
  compile
}
