// Augments the matcher types with @testing-library/jest-dom (toBeInTheDocument, …).
// jest-dom augments the global `jest.Matchers` interface, which vitest's `Assertion` extends
// (via `JestAssertion`), so the matchers are typed on vitest's `expect` too. The matchers are
// registered at runtime in vitest.setup.ts.
//
// Pulled in via a triple-slash reference rather than an `import` so this type-only file does not
// take a value dependency on a devDependency (see `import/no-extraneous-dependencies`).
/// <reference types="@testing-library/jest-dom" />
