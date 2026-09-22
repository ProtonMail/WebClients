import '@testing-library/jest-dom';

/**
 * The charts read the theme one frame after mounting, since a stylesheet applied in the same commit is not
 * there yet during it. Running that frame immediately keeps the tests about what a component renders rather
 * than about when: a test that cares about the frame itself suppresses this locally.
 */
beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
        callback(0);

        return 0;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
});

afterEach(() => {
    vi.unstubAllGlobals();
});
