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
