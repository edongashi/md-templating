const _ = require('lodash')

const hexTable = [
  '0', '1', '2', '3', '4', '5', '6', '7',
  '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'
]

function makeTerminal(v) {
  if (typeof v === 'function') {
    return [v()]
  }

  return [v]
}

function makeOperator(op, left, right) {
  return [op, left, right]
}

function asString(node) {
  if (!node) {
    return '?'
  }

  if (node && node.value) {
    return node.value.toString()
  } else {
    return node.toString()
  }
}

function serializeNode(node, parens = false, contextPriority = -1, depth = 0) {
  const isTerminal = node.length === 1
  if (isTerminal) {
    return asString(node[0])
  } else {
    const [op, left, right] = node
    let priority = 0
    if (op.priority) {
      priority = op.priority
    }

    const wrap = x => {
      if (depth === 0) {
        return x
      }

      if (parens || priority < contextPriority) {
        return '(' + x + ')'
      } else {
        return x
      }
    }

    return wrap(
      serializeNode(left, parens, priority, depth + 1)
      + asString(op)
      + serializeNode(right, parens, priority, depth + 1))
  }
}

module.exports = class Random {
  bin(len, chunksize = 0) {
    let str = ''
    for (let i = 0; i < len; i++) {
      str += this.int(2)
      if (chunksize > 0 && i < len - 1 && i % chunksize === 0) {
        str += ' '
      }
    }

    return str
  }

  range(start, length) {
    const result = []
    for (let i = 0; i < length; i++) {
      result.push(start + i)
    }

    return this.shuffle(result)
  }

  choice(array) {
    return array[this.int(array.length)]
  }

  subset(array, size) {
    if (size > array.length) {
      throw new Error('Invalid subset size.')
    }

    const numbers = this.range(0, array.length).slice(0, size)
    return numbers.map(i => array[i])
  }

  hex(len, chunksize = 0) {
    const result = _.times(len, () => this.choice(hexTable))
    if (chunksize > 0) {
      return _.chunk(result, chunksize).map(x => x.join('')).join(' ')
    } else {
      return result.join('')
    }
  }

  bool() {
    return this.int(2) === 1
  }

  shuffle(array) {
    return _.sortBy(array, () => Math.random())
  }

  expr(nodes, ops, config = {}) {
    const addedNodes = []
    const addedOps = []

    if (typeof config === 'number') {
      config = { maxOps: config }
    }

    const {
      maxOps = 1,
      maxDepth = 3,
      parens = true
    } = config

    let i = 0
    const makeNode = (depth = 0) => {
      if (i >= maxOps || depth >= maxDepth) {
        let node = this.choice(nodes)
        if (addedNodes.includes(node)) {
          node = this.choice(nodes)
        }

        if (addedNodes.includes(node)) {
          node = this.choice(nodes)
        }

        if (!addedNodes.includes(node)) {
          addedNodes.push(node)
        }

        return makeTerminal(node)
      } else {
        let op = this.choice(ops)
        if (addedOps.includes(op)) {
          op = this.choice(ops)
        }

        if (!addedOps.includes(op)) {
          addedOps.push(op)
        }

        i++
        const [left, right] = this.shuffle([makeNode(depth + 1), makeNode(depth + 1)])
        return makeOperator(op, left, right)
      }
    }

    const root = makeNode()
    return serializeNode(root, parens)
  }

  id() {
    return this.hex(16)
  }

  exp2(min, max) {
    return 2 ** this.int(min, max)
  }

  float(min, max) {
    return Math.random() * (max - min) + min
  }

  int(min, max) {
    if (typeof max === 'undefined') {
      max = min
      min = 0
    }

    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min
  }

  seq(len, min, max) {
    _.times(len, () => this.int(min, max))
  }
}
