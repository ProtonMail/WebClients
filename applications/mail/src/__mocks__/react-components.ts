export const useApi = jest.fn();

export const useEventManager = () => ({
    subscribe: jest.fn()
});

export const useMailSettings = jest.fn();

export const classnames = jest.fn((...args) => args);

export const Loader = () => 'Loader';
