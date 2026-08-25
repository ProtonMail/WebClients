import '@testing-library/jest-dom';

// jsdom ships no ResizeObserver; `@proton/atoms`' Scroll observes its box on mount.
window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));
