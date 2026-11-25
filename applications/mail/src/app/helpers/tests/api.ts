import { addApiMock, addApiResolver, apiMock, clearApiMocks } from '@proton/test-api/vitest/api';

/**
 * Export for backward compatibility in the tests. It can be gradually migrated to use @proton/test-api directly
 * in the tests.
 */
export { addApiMock, addApiResolver, apiMock as api, clearApiMocks };

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
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    // Drop the pseudo-element argument: jsdom does not implement it and logs "Not implemented" errors
    const { getComputedStyle } = window;
    window.getComputedStyle = (elt) => getComputedStyle(elt);
    window.ResizeObserver = vi.fn(function () {
        return {
            observe: vi.fn(),
            unobserve: vi.fn(),
            disconnect: vi.fn(),
        };
    }) as unknown as typeof ResizeObserver;
};
