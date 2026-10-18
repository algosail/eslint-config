// @ts-check
import babelParser from '@babel/eslint-parser'

/**
 * @param {string} line
 * @returns {{ prefix: string, code: string }}
 */
function splitPrefix(line) {
  const match = /^( *)(\* ?)(.*)$/.exec (line)
  if (!match) return { prefix: '', code: line }
  return {
    prefix: (match[1] ?? '') + (match[2] ?? ''),
    code: match[3] ?? '',
  }
}

/**
 * Puts a JSDoc star on every line of a fix after the first.
 * An empty line stays ` *` so the comment does not gain a trailing space.
 * @param {string} text
 * @returns {string}
 */
function commentify(text) {
  const lines = text.split ('\n')
  let out = (lines[0] ?? '').replace (/\r$/, '')
  for (let i = 1; i < lines.length; i++) {
    const line = (lines[i] ?? '').replace (/\r$/, '')
    out += line.length === 0 ? '\n *' : `\n * ${line}`
  }
  return out
}

/**
 * @param {string} text
 * @param {number} bodyStart
 * @param {number} limit
 * @returns {{ code: string, map: number[], next: number } | null}
 */
function extractUntilClose(text, bodyStart, limit) {
  let i = bodyStart
  let code = ''
  /** @type {number[]} */
  const map = []
  while (i < limit) {
    let lineEnd = text.indexOf ('\n', i)
    if (lineEnd === -1 || lineEnd > limit) lineEnd = limit
    const { prefix, code: lineCode } = splitPrefix (text.slice (i, lineEnd))
    if (lineCode.startsWith ('```')) {
      map.push (i > bodyStart && text[i - 1] === '\n' ? i - 1 : i)
      return { code, map, next: Math.min (lineEnd + 1, text.length) }
    }
    const codeStart = i + prefix.length
    for (let c = 0; c < lineCode.length; c++) map.push (codeStart + c)
    code += lineCode
    if (lineEnd >= limit || text[lineEnd] !== '\n') {
      map.push (lineEnd)
      return { code, map, next: limit }
    }
    const nextLineStart = lineEnd + 1
    let nextLineEnd = text.indexOf ('\n', nextLineStart)
    if (nextLineEnd === -1 || nextLineEnd > limit) nextLineEnd = limit
    const nextCode = splitPrefix (text.slice (nextLineStart, nextLineEnd)).code
    if (nextCode.startsWith ('```')) {
      map.push (lineEnd)
      return { code, map, next: Math.min (nextLineEnd + 1, text.length) }
    }
    map.push (lineEnd)
    code += '\n'
    i = nextLineStart
  }
  return null
}

/**
 * @param {string} text
 * @param {import('eslint').Linter.ParserOptions} parserOptions
 * @returns {{ code: string, map: number[] }[]}
 */
function findExamples(text, parserOptions) {
  const parsed = babelParser.parseForESLint (text, parserOptions)
  /** @type {{ code: string, map: number[] }[]} */
  const examples = []
  for (const comment of parsed.ast.comments ?? []) {
    if (comment.type !== 'Block' || !comment.range) continue
    const [start, end] = comment.range
    let i = start
    let seenExample = false
    while (i < end) {
      let lineEnd = text.indexOf ('\n', i)
      if (lineEnd === -1 || lineEnd > end) lineEnd = end
      const line = text.slice (i, lineEnd)
      const { code } = splitPrefix (line)
      if (/(^|\s)@example\b/.test (line)) seenExample = true
      if (seenExample && /^```(?:ts|typescript)\s*$/.test (code.trim ())) {
        const bodyStart = lineEnd < text.length && text[lineEnd] === '\n'
          ? lineEnd + 1
          : end
        const extracted = extractUntilClose (text, bodyStart, end)
        if (extracted) {
          examples.push ({ code: extracted.code, map: extracted.map })
          i = extracted.next
          seenExample = false
          continue
        }
      }
      i = Math.min (lineEnd + 1, end)
    }
  }
  return examples
}

/**
 * @param {string} text
 * @param {number} line
 * @param {number} column
 * @returns {number}
 */
function offsetOf(text, line, column) {
  let current = 1
  let index = 0
  while (current < line && index < text.length) {
    if (text[index] === '\n') current++
    index++
  }
  return index + Math.max (0, column - 1)
}

/**
 * @param {string} text
 * @param {number} offset
 * @returns {{ line: number, column: number }}
 */
function positionOf(text, offset) {
  let line = 1
  let lastBreak = -1
  const end = Math.min (Math.max (offset, 0), text.length)
  for (let index = 0; index < end; index++) {
    if (text[index] === '\n') {
      line++
      lastBreak = index
    }
  }
  return { line, column: offset - lastBreak }
}

/**
 * @param {{ range: [number, number], text: string } | null | undefined} fix
 * @param {number[]} map
 * @returns {{ range: [number, number], text: string } | undefined}
 */
function translateFix(fix, map) {
  if (!fix) return undefined
  const start = map[fix.range[0]]
  const end = map[fix.range[1]]
  if (start === undefined || end === undefined || start > end) return undefined
  return {
    range: /** @type {[number, number]} */ ([start, end]),
    text: commentify (fix.text),
  }
}

/**
 * @param {import('eslint').Linter.LintMessage} message
 * @param {{ code: string, map: number[] }} example
 * @param {string} fileText
 * @returns {import('eslint').Linter.LintMessage}
 */
function translateMessage(message, example, fileText) {
  const translated = { ...message }
  if (
    typeof message.line === 'number' && message.line > 0 &&
    typeof message.column === 'number'
  ) {
    const offset = offsetOf (example.code, message.line, message.column)
    const at = example.map[Math.min (offset, example.map.length - 1)]
    if (at !== undefined) {
      const pos = positionOf (fileText, at)
      translated.line = pos.line
      translated.column = pos.column
    }
  }
  if (
    typeof message.endLine === 'number' && message.endLine > 0 &&
    typeof message.endColumn === 'number'
  ) {
    const offset = offsetOf (example.code, message.endLine, message.endColumn)
    const at = example.map[Math.min (offset, example.map.length - 1)]
    if (at !== undefined) {
      const pos = positionOf (fileText, at)
      translated.endLine = pos.line
      translated.endColumn = pos.column
    }
  }
  if (message.fix) {
    const fix = translateFix (message.fix, example.map)
    if (fix) translated.fix = fix
    else delete translated.fix
  }
  if (message.suggestions) {
    translated.suggestions = message.suggestions.flatMap ((suggestion) => {
      const fix = translateFix (suggestion.fix, example.map)
      return fix ? [{ ...suggestion, fix }] : []
    })
  }
  return translated
}

/**
 * @param {import('eslint').Linter.ParserOptions} parserOptions
 */
export function createJsdocExamples(parserOptions) {
  /** @type {Map<string, { text: string, examples: { code: string, map: number[] }[] }>} */
  const pendingExamples = new Map ()

  return {
    supportsAutofix: true,
    /**
     * @param {string} text
     * @param {string} filename
     */
    preprocess(text, filename) {
      /** @type {{ code: string, map: number[] }[]} */
      let examples = []
      try {
        examples = findExamples (text, parserOptions)
      } catch {
        examples = []
      }
      pendingExamples.set (filename, { text, examples })
      return [
        text,
        ...examples.map ((example, index) => ({
          text: example.code,
          filename: `${index}.jsdoc-ts`,
        })),
      ]
    },
    /**
     * @param {import('eslint').Linter.LintMessage[][]} messageLists
     * @param {string} filename
     * @returns {import('eslint').Linter.LintMessage[]}
     */
    postprocess(messageLists, filename) {
      const entry = pendingExamples.get (filename)
      pendingExamples.delete (filename)
      const [fileMessages = [], ...exampleMessages] = messageLists
      if (!entry) return fileMessages
      /** @type {import('eslint').Linter.LintMessage[]} */
      const out = [...fileMessages]
      for (let index = 0; index < exampleMessages.length; index++) {
        const example = entry.examples[index]
        const messages = exampleMessages[index]
        if (!example || !messages) continue
        for (const message of messages) {
          out.push (translateMessage (message, example, entry.text))
        }
      }
      return out
    },
  }
}
