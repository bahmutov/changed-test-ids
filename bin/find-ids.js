#!/usr/bin/env node

// @ts-check

const arg = require('arg')
const debug = require('debug')('changed-test-ids')
const globby = require('globby')
const micromatch = require('micromatch')
const {
  findTestAttributesInFiles,
  findTestQueriesInFiles,
  findTestQueriesInFile,
  findTestAttributesInChangedSourceFiles,
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
  // find specs that use these test ids (comma-separated list)
  '--test-ids': String,
  // read test ids from the given text file (comma-separated list)
  '--test-ids-from-file': String,
  // output additional information
  '--verbose': Boolean,
  // output found test ids using comma-separated list
  '--comma': Boolean,
  // output unused test ids from the given list
  '--unused': Boolean,

  // aliases
  '--spec': '--specs',
  '--commands': '--command',
  '--set-gha-output': '--set-gha-outputs',
  '--v': '--verbose',
})

debug('arguments %o', args)

const verbose = args['--verbose']
const useChangedSourceFiles = Boolean(args['--sources'] && args['--branch'])
const warnMode = Boolean(args['--sources'] && args['--specs'])
const changedMode = Boolean(warnMode && args['--branch'])
const specsForTestIdsMode = Boolean(
  (args['--test-ids'] || args['--test-ids-from-file']) && args['--specs'],
)

debug('modes %o', {
  useChangedSourceFiles,
  specsForTestIdsMode,
  warnMode,
  changedMode,
  verbose,
})

function getTestIds() {
  if (args['--test-ids']) {
    debug('parsing test ids from the command line')
    return args['--test-ids']
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  if (args['--test-ids-from-file']) {
    debug('reading test ids from the file %s', args['--test-ids-from-file'])
    const fs = require('fs')
    const filename = args['--test-ids-from-file']
    const contents = fs.readFileSync(filename, 'utf-8')
    return contents
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
}

if (specsForTestIdsMode) {
  debug('finding specs using the given test ids')
  const testIds = getTestIds()
  if (!Array.isArray(testIds)) {
    console.error('Missing test ids')
    process.exit(1)
  }

  debug('have %d test ids: %s', testIds.length, testIds.join(', '))
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

  // each test id is a key, and the value
  // is a list of specs that use that test id
  const testIdToSpecs = {}
  testIds.forEach((testId) => {
    testIdToSpecs[testId] = []
  })

  const specsToRun = specFiles.filter((filename) => {
    const specTestIds = findTestQueriesInFile(filename, options)
    let specUsesTestId = false
    testIds.forEach((testId) => {
      if (specTestIds.includes(testId)) {
        specUsesTestId = true
        testIdToSpecs[testId].push(filename)
      }
    })
    return specUsesTestId
  })

  const unusedTestIds = testIds.filter(
    (testId) => testIdToSpecs[testId].length === 0,
  )

  if (!specsToRun.length) {
    console.log(
      'Could not find any specs that use the given test ids "%s"',
      testIds.join(', '),
    )
  } else {
    if (!args['--unused']) {
      console.log(
        'These %d specs use the given test ids "%s"',
        specsToRun.length,
        testIds.join(', '),
      )
    }

    if (unusedTestIds.length) {
      if (args['--unused']) {
        console.warn(
          '%d test ids were not used in any specs',
          unusedTestIds.length,
        )
        console.log(unusedTestIds.join(','))
      } else {
        console.warn(
          'The following %d test ids were not used in any specs',
          unusedTestIds.length,
        )
        console.warn(unusedTestIds.join(', '))
      }
    }
    if (verbose) {
      testIds.forEach((testId) => {
        if (testIdToSpecs[testId].length) {
          console.log(
            '"%s" used in %d spec(s)',
            testId,
            testIdToSpecs[testId].length,
          )
          console.log('  %s', testIdToSpecs[testId].join(', '))
        } else {
          console.log('"%s" not found in any of the specs', testId)
        }
      })
    } else {
      if (!args['--unused']) {
        specsToRun.forEach((filename) => {
          console.log(filename)
        })
      }
    }

    if (args['--set-gha-outputs']) {
      debug('setting GitHub Actions outputs specsToRunN and specsToRun')
      debug('specsToRunN %d', specsToRun.length)
      debug('plus specsToRun')

      const specsString = specsToRun.join(',')
      core.setOutput('specsToRunN', specsToRun.length)
      core.setOutput('specsToRun', specsString)
      core.setOutput('unusedTestIdsN', unusedTestIds.length)
      core.setOutput('unusedTestIds', unusedTestIds.join(','))

      const list = [
        `${testIds.length} given test ids: ${testIds.join(', ')}`,
        `set specsToRunN=${specsToRun.length} and specs found as specsToRun: ${specsString}`,
      ]
      if (unusedTestIds.length) {
        list.push(
          `${
            unusedTestIds.length
          } test ids were not used in any specs: ${unusedTestIds.join(', ')}`,
        )
      }

      core.summary
        .addHeading('Specs using given test ids')
        .addList(list)
        .addLink(
          'bahmutov/changed-test-ids',
          'https://github.com/bahmutov/changed-test-ids',
        )
        .write()
    }
  }
} else if (useChangedSourceFiles) {
  const changedFilesContents = findChangedFiles(
    args['--branch'],
    args['--parent'],
  )
  debug(
    '%d changed files %s',
    changedFilesContents.length,
    changedFilesContents.map((x) => x.filename).join(', '),
  )
  // check the changed files against the source files using minimatch
  const changedSourceFiles = changedFilesContents.filter((sourceFile) => {
    return micromatch.isMatch(sourceFile.filename, args['--sources'])
  })

  debug(
    '%d changed source files against pattern "%s": %s',
    changedSourceFiles.length,
    args['--sources'],
    changedSourceFiles.map((x) => x.filename).join(', '),
  )
  const testIds = findTestAttributesInChangedSourceFiles(changedSourceFiles)
  if (!testIds.length) {
    console.log('no test ids detected')
    if (args['--set-gha-outputs']) {
      debug(
        'setting GitHub Actions outputs changedTestIdsN and changedTestIds to zero',
      )
      core.setOutput('changedTestIdsN', 0)
      core.setOutput('changedTestIds', '')
      core.summary
        .addHeading('changed-test-ids')
        .addTable([
          ['Parent branch', args['--branch']],
          ['Changed files', String(changedFilesContents.length)],
          ['Changed source files', String(changedSourceFiles.length)],
          ['Changed test ids', String(testIds.length)],
        ])
        .addLink(
          'bahmutov/changed-test-ids',
          'https://github.com/bahmutov/changed-test-ids',
        )
        .write()
    }
  } else {
    debug(
      'found %d test ids across %d changed source files',
      testIds.length,
      changedSourceFiles.length,
    )

    if (args['--specs']) {
      debug('finding specs using the changed test ids')
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
      debug('only outputting changed test ids')
      if (!testIds.length) {
        console.log(
          'Could not find any test ids in %d changed source files',
          changedSourceFiles.length,
        )
      } else {
        testIds.forEach((testId) => {
          console.log(testId)
        })

        if (args['--set-gha-outputs']) {
          debug(
            'setting GitHub Actions outputs changedTestIdsN and changedTestIds',
          )
          core.setOutput('changedTestIdsN', testIds.length)
          const ids = testIds.join(',')
          core.setOutput('changedTestIds', ids)
          core.summary
            .addHeading('Test Ids In Changed Source Files')
            .addTable([
              ['Parent branch', args['--branch']],
              ['Changed files', String(changedFilesContents.length)],
              ['Changed source files', String(changedSourceFiles.length)],
              ['Changed test ids N', String(testIds.length)],
              [
                'Changed test ids ',
                ids.length < 100 ? ids : ids.slice(0, 100) + '...',
              ],
            ])
            .addLink(
              'bahmutov/changed-test-ids',
              'https://github.com/bahmutov/changed-test-ids',
            )
            .write()
        }
      }
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
      console.error(
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
          if (args['--comma']) {
            const ids = testIds.join(',')
            console.log(ids)
          } else {
            // output a single test id per line
            testIds.forEach((testId) => {
              console.log(testId)
            })
          }
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
      const { testIds, testIdToFilenames } = findTestQueriesInFiles(
        specFiles,
        options,
      )
      console.error(
        'found %d test ids across %d specs',
        testIds.length,
        specFiles.length,
      )
      if (!testIds.length) {
        console.log('Could not find any test ids in %d specs', specFiles.length)
      } else {
        if (!warnMode) {
          if (verbose) {
            Object.keys(testIdToFilenames).forEach((testId) => {
              if (testIdToFilenames[testId].length) {
                console.log(
                  '"%s" used in %d spec(s)',
                  testId,
                  testIdToFilenames[testId].length,
                )
                console.log('  %s', testIdToFilenames[testId].join(', '))
              } else {
                console.log('"%s" not found in any of the specs', testId)
              }
            })
          } else {
            // will report test ids later
            if (args['--comma']) {
              const ids = testIds.join(',')
              console.log(ids)
            } else {
              testIds.forEach((testId) => {
                console.log(testId)
              })
            }
          }
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
