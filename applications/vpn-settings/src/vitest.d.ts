// Augments the matcher types with @testing-library/jest-dom (toBeInTheDocument, …).
// jest-dom augments the global `jest.Matchers` interface, which vitest's `Assertion` extends
// (via `JestAssertion`), so the matchers are typed on vitest's `expect` too. The matchers are
// registered at runtime in vitest.setup.ts.
import '@testing-library/jest-dom';
