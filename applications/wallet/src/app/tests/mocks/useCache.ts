import * as cacheModule from '../../utils/cache';

/**
 * Mocks the `isFullSyncDone` function to return the specified boolean value.
 *
 * @param {boolean} mockedValue - The value you want `isFullSyncDone` to return.
 * @returns {vi.SpyInstance} - The spy instance, so you can add assertions.
 */
export const mockIsFullSyncDone = (mockedValue: boolean) => {
    const spy = vi.spyOn(cacheModule, 'isFullSyncDone');
    spy.mockImplementation(() => mockedValue);
    return spy;
};

/**
 * Mocks the `setFullSyncDone` function to do nothing but still track calls.
 *
 * @returns {vi.SpyInstance} - The spy instance, so you can add assertions.
 */
export const mockSetFullSyncDone = () => {
    const spy = vi.spyOn(cacheModule, 'setFullSyncDone');
    spy.mockImplementation(() => undefined); // No-op function
    return spy;
};

/**
 * Mocks the `clearChangeSet` function to do nothing but still track calls.
 *
 * @returns {vi.SpyInstance} - The spy instance, so you can add assertions.
 */
export const mockClearChangeSet = () => {
    const spy = vi.spyOn(cacheModule, 'clearChangeSet');
    spy.mockImplementation(() => undefined); // No-op function
    return spy;
};
