import 'vitest';

interface ResponseMatchers<R = unknown> {
    toMatchResponse(expected: Response): Promise<R>;
}

declare module 'vitest' {
    interface Assertion<T = any> extends ResponseMatchers<T> {}
    interface AsymmetricMatchersContaining extends ResponseMatchers {}
}
