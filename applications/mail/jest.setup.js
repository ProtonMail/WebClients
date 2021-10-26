import '@testing-library/jest-dom/extend-expect';
import { init } from 'pmcrypto/lib/pmcrypto';
import * as openpgp from 'openpgp';

init(openpgp);

// Silence warnings on expect to throw https://github.com/testing-library/react-testing-library/issues/157
// console.error = () => {};
// console.warn = () => {};

// Globally mocked @proton/components modules
jest.mock('@proton/components/hooks/useEventManager.ts', () => {
    const subscribe = jest.fn();
    const call = jest.fn();
    const stop = jest.fn();
    const start = jest.fn();

    const result = () => {
        return { subscribe, call, stop, start };
    };

    result.subscribe = subscribe;
    result.call = call;
    result.stop = stop;
    result.start = start;

    return result;
});

// Globally mocked upload helper (standard requests are mocked through context)
jest.mock('./src/app/helpers/upload');

global.MutationObserver = class {
    disconnect() {} // eslint-disable-line
    observe() {} // eslint-disable-line
};
