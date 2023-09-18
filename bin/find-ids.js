#!/usr/bin/env node

const arg = require('arg')
const debug = require('debug')('changed-test-ids')
const globby = require('globby')
const { findTestAttributesInFiles, findTestQueriesInFiles } = require('../src')

const args = arg({
  // find test ids in the source files
  '--sources': String,
  // find test ids in the spec files
  '--specs': String,
  // (optional) spec custom command to look for
  '--command': String,
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

if (args['--specs']) {
  debug('finding test ids in the specs "%s"', args['--specs'])
  const specFiles = globby.sync(args['--specs'], {
    sort: true,
  })
  if (!specFiles.length) {
    console.error('No files matching "%s" found', args['--specs'])
  } else {
    debug('found %d specs matching %s', specFiles.length, args['--specs'])
    specFiles.forEach((filename) => {
      debug(filename)
    })
    const options = {
      commands: [],
    }
    if (args['--command']) {
      debug('will look for custom command %s', args['--command'])
      options.commands.push(args['--command'])
    }
    const testIds = findTestQueriesInFiles(specFiles, options)
    debug('found %d test ids across %d specs', testIds.length, specFiles.length)
    if (!testIds.length) {
      console.log('Could not find any test ids in %d specs', specFiles.length)
    } else {
      testIds.forEach((testId) => {
        console.log(testId)
      })
    }
  }
}