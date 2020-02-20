# Markdown Templating

```
Usage: node index [options]

Options:
  -p, --purge           Purge output directory first
  -f, --file <file>     Source file
  -r, --repeat [times]  Files to create (default: 1)
  -o, --outdir [dir]    Output directory (default: "compiled")
  -n, --name [name]     Output file name (default: "@{basename}-@{id}@{extension}")
  -c, --cmd [cmd]       Shell command or script to apply to output
  -h, --help            output usage information
```

## Syntax

Escape syntax: `hello <?= user ?>`

Evaluate syntax: `<? print('hello ' + user) ?>`

Interpolate syntax: `hello @{user}`

## Include function

Files can be included via the auto-imported `include(path, data)` function.
Escape syntax is not preferred when including files.

`main.md`:

```md
# Main file.

Other file says: @{include('./child.md', ['parent', 'main'])}
```

`child.md`:

```md
Hello @{parent} from @{filename}!
```

Output:

```md
# Main file.

Other file says: Hello main from child.md!
```
