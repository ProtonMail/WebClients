import type { FeatureCode } from '@proton/features';
import {
    addApiMock,
    addApiResolver,
    apiMock,
    apiMocksMap,
    getFeatureFlags as baseGetFeatureFlags,
    clearApiMocks,
} from '@proton/testing';

/**
 * Export for backward compatibility in the tests. It can be gradually migrated to use @proton/testing package directly
 * in the tests.
 */
export { addApiMock, addApiResolver, clearApiMocks, apiMock as api, apiMocksMap as apiMocks };

export const getFeatureFlags = (features: [FeatureCode, boolean][]) => {
    return baseGetFeatureFlags([...features]);
};

export const parseFormData = (data: any) => {
    const result: any = {};

    const createStructure = (resultContext: any, name: string, left: string, value: any) => {
        if (!resultContext[name]) {
            resultContext[name] = {};
        }
        if (left === '') {
            resultContext[name] = value;
        } else {
            const [, newName, newLeft] = /^\[([^[]+)\](.*)/.exec(left) || [];
            createStructure(resultContext[name], newName, newLeft, value);
        }
    };

    Object.entries(data).forEach(([key, value]) => {
        const [, name, left] = /^([^[]+)(.*)/.exec(key) || [];
        createStructure(result, name, left, value);
    });

    return result;
};

export const mockDomApi = () => {
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    // https://github.com/nickcolley/jest-axe/issues/147#issuecomment-758804533
    const { getComputedStyle } = window;
    window.getComputedStyle = (elt) => getComputedStyle(elt);
    window.ResizeObserver = jest.fn(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
    }));
};
