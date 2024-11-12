import { migrate } from 'proton-pass-web/lib/spotlight';
import { SPOTLIGHT_STORAGE_KEY, getSpotlightStorageKey } from 'proton-pass-web/lib/storage';

jest.mock('proton-pass-web/app/Store/store', () => ({}));

const LEGACY_DATA = JSON.stringify({ legacy: true });
const ACTIVE_DATA = JSON.stringify({ legacy: false });
const ACTIVE_KEY = getSpotlightStorageKey(0);

describe('spotlight', () => {
    const getItem: jest.SpyInstance = jest.spyOn(Storage.prototype, 'getItem');
    const setItem: jest.SpyInstance = jest.spyOn(Storage.prototype, 'setItem');
    const removeItem: jest.SpyInstance = jest.spyOn(Storage.prototype, 'removeItem');

    beforeEach(() => {
        getItem.mockClear();
        setItem.mockClear();
        removeItem.mockClear();
    });

    test('should not migrate when `activeStorageKey` matches `ONBOARDING_STORAGE_KEY`', () => {
        migrate(SPOTLIGHT_STORAGE_KEY);

        expect(setItem).not.toHaveBeenCalled();
        expect(removeItem).not.toHaveBeenCalled();
    });

    test('should migrate spotlight data if it exists and not migrated yet', () => {
        getItem.mockImplementation((key: string) => (key === SPOTLIGHT_STORAGE_KEY ? LEGACY_DATA : null));
        migrate(ACTIVE_KEY);

        expect(localStorage.removeItem).toHaveBeenCalledWith(SPOTLIGHT_STORAGE_KEY);
        expect(localStorage.setItem).toHaveBeenCalledWith(ACTIVE_KEY, LEGACY_DATA);
    });

    test('should not migrate spotlight storage if already migrated', () => {
        getItem.mockImplementation((key: string) => (key === SPOTLIGHT_STORAGE_KEY ? LEGACY_DATA : ACTIVE_DATA));
        migrate(ACTIVE_KEY);

        expect(localStorage.removeItem).toHaveBeenCalledWith(SPOTLIGHT_STORAGE_KEY);
        expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    test('should noop if nothing to migrate', () => {
        getItem.mockReturnValue(null);
        migrate(ACTIVE_KEY);

        expect(localStorage.removeItem).not.toHaveBeenCalled();
        expect(localStorage.setItem).not.toHaveBeenCalled();
    });
});
