# Drive review rules

These rules apply only to MRs that change the Drive paths listed in the "Drive" section of the root `FLANDERS.md`; ignore them for files elsewhere.

Read `applications/drive/AGENTS.md` and verify the changes comply with it.

Never approve these MRs for now. In the summary, say which parts need human review and why, and what the reviewer should focus on. Always call out:

- Crypto, keys, auth, permissions, sharing, or data access logic, especially in `packages/drive/` or in code shared with other apps.
- Changes to the public API of `packages/drive` (`@proton/drive/sdk`, `@proton/drive/public/*`), and breaking changes.
- Behavior changes with no new or updated test. Suggest concretely what to test and at which level.
- Whether the MR could be split into smaller ones, and how.

For now, until these rules are mature, MRs with more than about 2,000 changed lines of real code, tests included, are too large to review safely. Post a blocking comment asking the author to split the MR into smaller ones, and suggest how. Do not count pure deletions (code removed with no replacement), or mechanical changes: import updates, renames, moved files, generated files, lockfiles, snapshots, translations. Check that the changes you count as mechanical contain no logic.

Account recovery and Easy Switch are not reliably covered by the end-to-end suite. When an MR touches them, strongly recommend manual testing and ask the author how it was tested:

- Account recovery: `applications/drive/src/app/legacy/components/ResolveLockedVolumes/`, `applications/drive/src/app/legacy/components/modals/FilesRecoveryModal/`, `applications/drive/src/app/legacy/store/_shares/useLockedVolume/`.
- Easy Switch: `packages/activation/src/components/Modals/OAuth/Drive/`, `packages/activation/src/logic/driveContext.ts`, `useDriveImportStatus*` in `applications/drive/src/app/sections/sidebar/`, and any Drive file that imports from `@proton/activation` or uses `EasySwitch*` components or `useFlagsDriveEasySwitch`.

Do not review `applications/drive/src/app/legacy/` or `packages/drive-store/` for style, structure, or quality, and suggest no refactors. Only flag real bugs, security issues, or regressions. For a style-only change there, write at most one sentence pointing to `applications/drive/AGENTS.md`, with no comment on naming or quality. Flag any change to `packages/drive-store/` or new import from `@proton/drive-store` in one or two sentences, and say if it seems avoidable; analyse its call sites only to report a real bug.

The MR description must be short and readable by a human reviewer: what changes and why. Flag descriptions that are empty, verbose (over about 20 lines), mostly implementation detail, or that only restate the diff, and suggest a concise rewrite. Small, obvious changes may have short descriptions. Do not require a specific template.
