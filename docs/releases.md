# Package release process

The only npm package is `4lothru`, which bundles the SDK, CLI, and guide schema:

| Package | Purpose |
| --- | --- |
| `4lothru` | SDK exports and `4lothru` CLI |

The workspace root, internal implementation packages, applications, and guide
content are not published or independently versioned.

## Versioning policy

Package versions follow [Semantic Versioning](https://semver.org/):

- **patch** for backwards-compatible bug fixes and documentation-only package
  corrections;
- **minor** for backwards-compatible features;
- **major** for removed APIs or other breaking changes.

Until `1.0.0`, breaking changes still use a minor bump.

The package began at `0.1.0`, recorded as the initial-development baseline in
its changelog. Do not manually edit later package versions or changelog entries;
Changesets produces them during the release step.

## Pull requests

Every pull request that changes code, public types, package metadata, or runtime
behavior included in `4lothru` must include a changeset:

```bash
pnpm changeset
```

Select `4lothru`, choose the appropriate SemVer bump, and write a concise
user-facing summary. Commit the generated file under `.changeset/`.
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

`pnpm version-packages` consumes pending changesets, updates the `4lothru`
version, and writes its `CHANGELOG.md`. Review and commit those generated
changes in a dedicated release pull request. Tag the merged release commit
with an annotated tag such as `4lothru@0.2.0`.

## Publishing

The package is configured for public npm publication. Create an npm access
token with publish access to `4lothru` and save it as the `NPM_TOKEN` secret in
the `npm-publish` GitHub environment.
The workflow uses this token for `pnpm publish`; it does not use npm trusted
publishing/OIDC. The **Publish 4lothru** workflow stages new versions;
versions already on npm are skipped. A maintainer must approve each staged
version with npm 2FA before it becomes publicly available.

Test each package's contents before announcing a release:

```bash
pnpm --dir packages/4lothru exec npm pack --dry-run
```

From the tagged release commit, manually dispatch the **Publish 4lothru**
workflow, select the release tag as its ref, and confirm publishing. It
validates the release before staging `4lothru`. Review and approve the new
version from npm's **Staged Packages** page before announcing the release.

Run `npm view 4lothru version` after publication and verify the generated
changelog and tarball contents before announcing the release.
