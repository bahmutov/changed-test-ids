#!/usr/bin/env node

const arg = require('arg')
const debug = require('debug')('changed-test-ids')
const globby = require('globby')
const {
  findTestAttributesInFiles,
  findTestQueriesInFiles,
  findTestQueriesInFile,
} = require('../src')
const { findChangedFiles } = require('../src/git')
const core = require('@actions/core')

const args = arg({
  // find test ids in the source files
  '--sources': String,
  // find test ids in the spec files
  '--specs': String,
  // (optional) spec custom command(s) to look for
  '--command': String,
  // search the files that have changed against this Git branch
  '--branch': String,
  // search the files that have changed against the parent of the branch
  '--parent': Boolean,
  // when enabled, this code uses GitHub Actions Core package
  // to set two named outputs, one for number of changed specs
  // another for actual list of files
  '--set-gha-outputs': Boolean,

  // aliases
  '--commands': '--command',
})

debug('arguments %o', args)

const warnMode = args['--sources'] && args['--specs']
const changedMode = warnMode && args['--branch']

debug('modes %o', { warnMode, changedMode })

if (changedMode) {
  const changedFiles = findChangedFiles(args['--branch'], args['--parent'])
  debug('%d changed files %s', changedFiles.length, changedFiles.join(', '))
  const sourceFiles = globby.sync(args['--sources'], {
    sort: true,
  })
  const changedSourceFiles = changedFiles.filter((filename) =>
    sourceFiles.includes(filename),
  )
  debug(
    '%d changed source files %s',
    changedSourceFiles.length,
    changedSourceFiles.join(', '),
  )
  const testIds = findTestAttributesInFiles(changedSourceFiles)
  debug(
    'found %d test ids across %d changed source files',
    testIds.length,
    changedSourceFiles.length,
  )
  const specFiles = globby.sync(args['--specs'], {
    sort: true,
  })
  const options = {
    commands: [],
  }
  if (args['--command']) {
    debug('will look for custom command %s', args['--command'])
    const commands = args['--command'].split(',').filter(Boolean)
    options.commands.push(...commands)
  }
  const specsToRun = specFiles.filter((filename) => {
    const specTestIds = findTestQueriesInFile(filename, options)
    return specTestIds.some((testId) => testIds.includes(testId))
  })

  // TODO: keep track of test ids NOT covered by any specs
  // and warn by default

  if (!specsToRun.length) {
    console.log(
      'Could not find any specs that use test ids "%s" from changed source files',
      testIds.join(', '),
    )
  } else {
    console.log(
      'These %d specs use the test ids "%s" found in the changed source files',
      specsToRun.length,
      testIds.join(', '),
    )
    specsToRun.forEach((filename) => {
      console.log(filename)
    })

    if (args['--set-gha-outputs']) {
      debug('setting GitHub Actions outputs specsToRunN and specsToRun')
      debug('specsToRunN %d', specsToRun.length)
      debug('plus specsToRun')
      core.setOutput('specsToRunN', specsToRun.length)
      core.setOutput('specsToRun', specsToRun.join(','))
    }
  }
} else {
  const testIdsInSourceFiles = []
  const testIdsInSpecs = []

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
        if (!warnMode) {
          // will report test ids later
          testIds.forEach((testId) => {
            console.log(testId)
          })
        }
        testIdsInSourceFiles.push(...testIds)
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
        const commands = args['--command'].split(',').filter(Boolean)
        options.commands.push(...commands)
      }
      const testIds = findTestQueriesInFiles(specFiles, options)
      debug(
        'found %d test ids across %d specs',
        testIds.length,
        specFiles.length,
      )
      if (!testIds.length) {
        console.log('Could not find any test ids in %d specs', specFiles.length)
      } else {
        if (!warnMode) {
          // will report test ids later
          testIds.forEach((testId) => {
            console.log(testId)
          })
        }
        testIdsInSpecs.push(...testIds)
      }
    }
  }

  if (warnMode) {
    debug(
      'comparing %d test ids in the source files with %d test ids in specs',
      testIdsInSourceFiles.length,
      testIdsInSpecs.length,
    )
    const diff = testIdsInSourceFiles.filter(
      (testId) => !testIdsInSpecs.includes(testId),
    )
    if (!diff.length) {
      console.log('✅ all test ids in the source files were used in specs')
    } else {
      console.log(
        '⚠️ found %d test id(s) not covered by any specs',
        diff.length,
      )
      diff.forEach((testId) => {
        console.log(testId)
      })
    }
  }
}
