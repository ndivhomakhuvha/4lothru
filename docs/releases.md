# Package release process

Trail publishes three independently versioned npm packages:

| Package | Purpose |
| --- | --- |
| `@trail/sdk` | Browser-side guide runtime |
| `@trail/guide-schema` | Guide schema, types, and parsing |
| `@trail/cli` | `trail` validation, build, and preview command |

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
must be updated. `@trail/sdk` and `@trail/cli` depend on
`@trail/guide-schema`, so release their dependency update whenever Changesets
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
annotated tag, for example `@trail/sdk@0.2.0`. A release that updates multiple
packages has one tag per released package, all pointing to the same commit.

## Publishing

The packages currently have `"private": true`, so publication is deliberately
blocked while npm ownership and provenance are being set up. A maintainer must
make the following reviewed change before the first publish:

1. Remove `"private": true` only from the packages approved for npm.
2. Set `publishConfig.access` to `"public"` for each public package.
3. Confirm the `@trail` npm organization owns the package names and enable npm
   provenance for the publishing workflow.
4. Add an `NPM_TOKEN` repository secret with publish permission, protect the
   release environment, and test with `npm pack --dry-run` for each package.

After that one-time setup, publish the versioned packages from the tagged
release commit:

```bash
pnpm --filter @trail/guide-schema build
pnpm --filter @trail/sdk build
pnpm --filter @trail/guide-schema publish --access public --no-git-checks
pnpm --filter @trail/cli publish --access public --no-git-checks
pnpm --filter @trail/sdk publish --access public --no-git-checks
```

Publish `@trail/guide-schema` before packages that consume it. Run
`npm view @trail/<package> version` after each publication and verify the
generated changelog and tarball contents before announcing the release.
