import '@testing-library/jest-dom/extend-expect';

// Silence warnings on expect to throw https://github.com/testing-library/react-testing-library/issues/157
// console.error = () => {};
// console.warn = () => {};

// Globally mocked react-components modules
jest.mock('react-components/hooks/useEventManager.ts', () => {
    const subscribe = jest.fn();
    const call = jest.fn();

    const result = () => {
        return { subscribe, call };
    };

    result.subscribe = subscribe;
    result.call = call;

    return result;
});

// Globally mocked upload helper (standard requests are mocked through context)
jest.mock('./src/app/helpers/upload');

global.MutationObserver = class {
    constructor() {
        // Nothing
    }
    disconnect() {
        // Nothing
    }
    observe() {
        // Nothing
    }
};
