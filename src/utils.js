// @ts-check
const debug = require('debug')('changed-test-ids')
const fs = require('fs')

/**
 * Reads the list of ignored test ids from the given file path.
 * The file should contain comma-separated test ids.
 * You can also put test ids on separate lines.
 * Lines starting with # are treated as comments and ignored.
 * @param {string|undefined} filePath
 * @returns {Set<string>} Set of ignored test ids
 */
function readIgnoredTestIds(filePath) {
  const ignoredTestIds = new Set()
  if (!filePath) {
    debug('no ignored test ids file path provided')
    return ignoredTestIds
  }

  debug('reading ignored test ids from file %s', filePath)
  const contents = fs.readFileSync(filePath, 'utf-8')

  // process all lines, ignoring comments
  contents.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('#') || trimmed.length === 0) {
      return
    }
    trimmed
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((testId) => ignoredTestIds.add(testId))
  })

  debug(
    'have %d ignored test ids: %s',
    ignoredTestIds.size,
    Array.from(ignoredTestIds).join(', '),
  )
  return ignoredTestIds
}

module.exports = { readIgnoredTestIds }
