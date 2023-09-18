#!/usr/bin/env node

const arg = require('arg')
const debug = require('debug')('changed-test-ids')
const globby = require('globby')
const { findTestAttributesInFiles } = require('../src')

const args = arg({
  '--sources': String,
})

debug('arguments %o', args)

if (args['--sources']) {
  debug('finding test ids in the sources "%s"', args['--sources'])
  const sourceFiles = globby.sync(args['--sources'], {
    sort: true,
  })
  if (!sourceFiles.length) {
    console.error('No files matching "%s" found', args['--sources'])
  } else {
    debug(
      'found %d source files matching %s',
      sourceFiles.length,
      args['--sources'],
    )
    sourceFiles.forEach((filename) => {
      debug(filename)
    })
    const testIds = findTestAttributesInFiles(sourceFiles)
    debug(
      'found %d test ids across %d source files',
      testIds.length,
      sourceFiles.length,
    )
    if (!testIds.length) {
      console.log(
        'Could not find any test ids in %d source files',
        sourceFiles.length,
      )
    } else {
      testIds.forEach((testId) => {
        console.log(testId)
      })
    }
  }
}
