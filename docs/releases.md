# Package release process

Trail publishes three independently versioned npm packages:

| Package | Purpose |
| --- | --- |
| `@trail-cli/sdk` | Browser-side guide runtime |
| `@trail-cli/guide-schema` | Guide schema, types, and parsing |
| `@trail-cli/cli` | `trail` validation, build, and preview command |

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
must be updated. `@trail-cli/sdk` and `@trail-cli/cli` depend on
`@trail-cli/guide-schema`, so release their dependency update whenever Changesets
selects it.

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
annotated tag, for example `@trail-cli/sdk@0.2.0`. A release that updates multiple
packages has one tag per released package, all pointing to the same commit.

## Publishing

The versioned packages are configured for public npm publication. Before the
first publication, a maintainer must confirm that the `@trail` npm organization
owns all three package names and configure npm trusted publishing for this
repository/workflow on each package. Configure the `npm-publish` GitHub
environment with the required protection rules. The `Publish packages`
workflow publishes with npm provenance through its `id-token: write`
permission.

Test each package's contents before announcing a release:

```bash
pnpm --dir packages/guide-schema exec npm pack --dry-run
pnpm --dir packages/cli exec npm pack --dry-run
pnpm --dir packages/sdk exec npm pack --dry-run
```

From the tagged release commit, manually dispatch the **Publish packages**
workflow, select the release tag as its ref, and confirm publishing. It
validates the release before publishing `@trail-cli/guide-schema`, then
`@trail-cli/cli`, and then `@trail-cli/sdk`.

Run `npm view @trail-cli/<package> version` after each publication and verify the
generated changelog and tarball contents before announcing the release.
