# Package release process

The single-install `4lothru` package exposes the SDK and CLI. It depends on
these implementation packages, which are also published for dependency resolution:

| Package | Purpose |
| --- | --- |
| `4lothru` | Recommended user-facing package: SDK exports and `4lothru` CLI |
| `@4lothru/sdk` | Browser-side guide runtime |
| `@4lothru/guide-schema` | Guide schema, types, and parsing |
| `@4lothru/cli` | Guide validation, build, and preview implementation |

The workspace root, applications, and guide content are private deployment
artifacts. They are not npm packages and do not receive package releases.

## Versioning policy

Package versions follow [Semantic Versioning](https://semver.org/):

- **patch** for backwards-compatible bug fixes and documentation-only package
  corrections;
- **minor** for backwards-compatible features;
- **major** for removed APIs or other breaking changes.

Until `1.0.0`, breaking changes still use a minor bump. A package that did not
change directly may receive a patch bump when its published dependency range
must be updated. `@4lothru/sdk` and `@4lothru/cli` depend on
`@4lothru/guide-schema`, and `4lothru` depends on the SDK and CLI, so release
their dependency updates whenever Changesets selects them.

All packages begin at `0.1.0`, recorded as the initial-development baseline in
each package changelog. Do not manually edit later package versions or
changelog entries; Changesets produces them during the release step.

## Pull requests

Every pull request that changes code, public types, package metadata, or
runtime behavior in a publishable package must include a changeset:

```bash
pnpm changeset
```

Select every affected package, choose the appropriate SemVer bump, and write
a concise user-facing summary. Commit the generated file under `.changeset/`.
Changes limited to private applications, guides, CI, or repository
documentation need no changeset. If an externally observable package change
intentionally needs no release, record the reason in the pull request.

## Preparing a release

Release only from an up-to-date `main` branch after CI is green:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm guides:validate
pnpm build
pnpm version-packages
```

`pnpm version-packages` consumes pending changesets, updates only affected
package versions and internal dependency ranges, and writes per-package
`CHANGELOG.md` files. Review and commit those generated changes in a dedicated
release pull request. Tag the merged release commit with a package-specific
annotated tag, for example `4lothru@0.2.0`. A release that updates multiple
packages has one tag per released package, all pointing to the same commit.

## Publishing

The versioned packages are configured for public npm publication. Before the
first publication, a maintainer must confirm that the `4lothru` package name and
the `@4lothru` npm organization are available, and create a granular `NPM_TOKEN`
with stage-only access to the unscoped `4lothru` package and `@4lothru` scope.
Save that token in the
`npm-publish` GitHub environment. The `Publish packages` workflow stages
each new package version in dependency order; versions already on npm are
skipped. A maintainer must approve each staged package with npm 2FA before it
becomes publicly available.

Test each package's contents before announcing a release:

```bash
pnpm --dir packages/guide-schema exec npm pack --dry-run
pnpm --dir packages/cli exec npm pack --dry-run
pnpm --dir packages/sdk exec npm pack --dry-run
pnpm --dir packages/4lothru exec npm pack --dry-run
```

From the tagged release commit, manually dispatch the **Publish packages**
workflow, select the release tag as its ref, and confirm publishing. It
validates the release before staging new versions of `@4lothru/guide-schema`,
`@4lothru/cli`, `@4lothru/sdk`, and finally `4lothru`. Review and approve each
new package version from npm's **Staged Packages** page before announcing the
release.

Run `npm view 4lothru version` and `npm view @4lothru/<package> version` after
publication and verify the
generated changelog and tarball contents before announcing the release.
