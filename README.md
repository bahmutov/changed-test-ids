# changed-test-ids [![main](https://github.com/bahmutov/changed-test-ids/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/bahmutov/changed-test-ids/actions/workflows/ci.yml)

> Select tests to run based on source file changes and test ids

📝 Read the blog posts [Using Test Ids To Pick Cypress Specs To Run](https://glebbahmutov.com/blog/using-test-ids-to-pick-specs-to-run/) and [Pick Tests Using Test Ids From Another Source Repo](https://glebbahmutov.com/blog/pick-tests-in-another-repo/) and [How I Add Test Ids To Front-End Components](https://glebbahmutov.com/blog/how-i-add-test-ids/)

## API

- `findTestQueries`
- `findTestQueriesInFile`
- `findTestQueriesInFiles`
- `findTestAttributes`
- `findTestAttributesInFile`
- `findTestAttributesInFiles`

## Output

List of data test ids, sorted alphabetically

## CLI

### Find test ids in the source files

```
$ npx find-ids --sources 'glob pattern to the JSX files'
```

Outputs the sorted list of test attributes, one per line. For example, use `npm run demo:sources`

By default, the utility prints a single test id per line. You can output a single comma-separated list by using the `--comma` argument

```
$ npx find-ids --sources 'glob pattern to the JSX files' --comma
```

### Find test ids used in Cypress specs

Let's look through the Cypress specs for custom command `cy.getById` and find all unique arguments

```
$ npx find-ids --specs 'glob pattern to the Cypress specs' --command getById
```

Outputs the sorted list of test attributes, one per line. For example, use `npm run demo:specs`. You can use several custom commands, separate them using commas `--commands getById,containsByTest`. Specs could be TypeScript.

If you want to pick both JS and TS tests, use glob syntax. For example, let's grab all `.cy.js` and `.cy.ts` specs

```
--specs 'tests/fixtures/*.cy.{js,ts}'
```

To produce verbose output showing specs for each test id, add argument `--verbose`

### Warn on untested ids

If you specify both sources and specs, then it will find all test ids used in the source files NOT used by the specs and list them one at a time

```
$ npx find-ids --sources ... --specs ... --command ...
⚠️ found 1 test id(s) not covered by any specs
name
```

### Specs to run based on Git changes

You can automatically compute which specs use the test ids from the changed source in the current branch.

```
$ npx find-ids --sources ... --specs ... --command ... --branch <compare against branch name>
```

If running on GitHub Actions, you can set the detected spec filenames as outputs by adding `--set-gha-outputs`. This sets the output variables `specsToRun` (comma-separated list of specs) and `specsToRunN` (number of specs found based on test ids in the changed source files).

### Test ids based on Git changes

You can simply detect test ids in the changed source files and output their list.

```
$ npx find-ids --sources --branch <compare against branch name>
```

If running on GitHub Actions, use `--set-gha-outputs` to set the list of detected test ids `changedTestIds` and the number `changedTestIdsN`. Any unused test ids will be set into outputs `unusedTestIds` and `unusedTestIdsN`.

### Find specs that use particular test ids

```
$ npx find-ids --specs ... --command ... --test-ids one,two
```

For example, to find all specs ending in `.cy.js` and `.cy.ts` files and that use custom command `cy.getBy` and use test id `greeting`

```
$ npx find-ids --specs 'cypress/e2e/**/*.cy.{js,ts}' --command getBy --test-ids greeting
```

You can output detailed information showing each spec using a test id by adding parameter `--verbose`

```
$ npx find-ids --specs 'cypress/e2e/**/*.cy.{js,ts}' --command getBy --test-ids greeting --verbose
```

## Debugging

This module uses [debug](https://github.com/debug-js/debug#readme) to output verbose logs. To see the logs, run with the following environment variable `DEBUG=changed-test-ids`

If a source file or a spec have syntax that cannot be parsed, they are ignored. You can see a debug message `changed-test-ids ⚠️ could not parse spec <filename> +0ms`

## Examples

- repo [bahmutov/taste-the-sauce-test-ids](https://github.com/bahmutov/taste-the-sauce-test-ids)

### Find sources in two folders

Let's say we want to find data attributes in all source files in the subfolders `pages` and `components`.

```
$ npx find-ids --sources '{pages,components}/**/*.jsx'
```

## Small print

Author: Gleb Bahmutov &lt;gleb.bahmutov@gmail.com&gt; &copy; 2023

- [@bahmutov](https://twitter.com/bahmutov)
- [glebbahmutov.com](https://glebbahmutov.com)
- [blog](https://glebbahmutov.com/blog)
- [videos](https://www.youtube.com/glebbahmutov)
- [presentations](https://slides.com/bahmutov)
- [cypress.tips](https://cypress.tips)
- [Cypress Tips & Tricks Newsletter](https://cypresstips.substack.com/)
- [my Cypress courses](https://cypress.tips/courses)

License: MIT - do anything with the code, but don't blame me if it does not work.

Support: if you find any problems with this module, email / tweet /
[open issue](https://github.com/bahmutov/changed-test-ids/issues) on Github

## MIT License

Copyright (c) 2023 Gleb Bahmutov &lt;gleb.bahmutov@gmail.com&gt;

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
