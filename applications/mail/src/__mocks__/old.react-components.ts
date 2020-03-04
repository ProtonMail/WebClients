export const api = jest.fn();
export const useApi = jest.fn(() => api);

export const useEventManager = () => ({
    call: jest.fn(),
    subscribe: jest.fn()
});

export const useMailSettings = jest.fn(() => [{}, false]);

export const classnames = jest.fn((...args) => args);

export const Loader = () => 'Loader';

export const useInstance = jest.fn((func) => func());

export const useLoading = jest.fn((initialValue) => [initialValue, jest.fn()]);

export const useLabels = jest.fn(() => [[], false]);

export const useUser = jest.fn(() => [{}, false]);

export const useConversationCounts = jest.fn(() => [[], false, null]);
export const useMessageCounts = jest.fn(() => [[], false, null]);
