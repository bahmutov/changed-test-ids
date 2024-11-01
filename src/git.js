const debug = require('debug')('changed-test-ids')
const debugGit = require('debug')('changed-test-ids:git')
const pluralize = require('pluralize')
const shell = require('shelljs')

/**
 * Finds files changed or added in the current branch when compared to the "origin/branch".
 * Returns a list of filenames + source file contents (before and after). If there are no files, returns an empty list.
 * @param {string} branch The branch to compare against.
 * @param {boolean} useParent Determine the changes only against the parent commit.
 */
function findChangedFiles(branch, useParent = false) {
  debug('findChangedFiles %o', { branch, useParent })

  if (!branch) {
    throw new Error('branch is required')
  }

  if (!shell.which('git')) {
    shell.echo('Sorry, this script requires git')
    return []
  }

  // can we find updated and added files?
  debug(
    'finding changed files against %s using parent?',
    branch,
    Boolean(useParent),
  )

  // find all added / changed / moved / renamed / deleted source files
  // A: added, M: modified, R: renamed, D: deleted
  if (useParent) {
    let result = shell.exec(`git merge-base origin/${branch} HEAD`, {
      silent: true,
    })
    if (result.code !== 0) {
      debugGit('git failed to find merge base with the branch %s', branch)
      return []
    }

    const commit = result.stdout.trim()
    debugGit('merge commit with branch "%s" is %s', branch, commit)
    result = shell.exec(`git diff --name-only --diff-filter=AMRD ${commit}..`, {
      silent: true,
    })
    if (result.code !== 0) {
      debugGit('git diff failed with code %d', result.code)
      return []
    }

    const filenames = result.stdout
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    debugGit(
      'found %d changed files against branch %s',
      filenames.length,
      branch,
    )

    const fileContents = filenames.map((filename) => {
      const before = shell.exec(`git show ${commit}:${filename}`, {
        silent: true,
      }).stdout
      const after = shell.exec(`git show HEAD:${filename}`, {
        silent: true,
      }).stdout
      return { filename, before, after }
    })

    return fileContents
  } else {
    const command = `git diff --name-only --diff-filter=AMRD origin/${branch}`
    debugGit('command: %s', command)

    const result = shell.exec(command, { silent: true })
    if (result.code !== 0) {
      debugGit('git diff failed with code %d', result.code)
      return []
    }

    const filenames = result.stdout
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    debugGit(
      'found %d changed %s',
      filenames.length,
      pluralize('file', filenames.length),
    )

    const fileContents = filenames.map((filename) => {
      const before = shell.exec(`git show origin/${branch}:${filename}`, {
        silent: true,
      }).stdout
      const after = shell.exec(`git show HEAD:${filename}`, {
        silent: true,
      }).stdout
      return { filename, before, after }
    })

    return fileContents
  }
}

module.exports = { findChangedFiles }
