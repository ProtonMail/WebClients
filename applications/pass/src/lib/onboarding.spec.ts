import { migrate } from 'proton-pass-web/lib/onboarding';
import { ONBOARDING_STORAGE_KEY, getOnboardingStorageKey } from 'proton-pass-web/lib/storage';

jest.mock('proton-pass-web/app/Store/store', () => ({}));

const LEGACY_DATA = JSON.stringify({ legacy: true });
const ACTIVE_DATA = JSON.stringify({ legacy: false });
const ACTIVE_KEY = getOnboardingStorageKey(0);

describe('onboarding', () => {
    const getItem: jest.SpyInstance = jest.spyOn(Storage.prototype, 'getItem');
    const setItem: jest.SpyInstance = jest.spyOn(Storage.prototype, 'setItem');
    const removeItem: jest.SpyInstance = jest.spyOn(Storage.prototype, 'removeItem');

    beforeEach(() => {
        getItem.mockClear();
        setItem.mockClear();
        removeItem.mockClear();
    });

    test('should not migrate when `activeStorageKey` matches `ONBOARDING_STORAGE_KEY`', () => {
        migrate(ONBOARDING_STORAGE_KEY);

        expect(setItem).not.toHaveBeenCalled();
        expect(removeItem).not.toHaveBeenCalled();
    });

    test('should migrate onboarding data if it exists and not migrated yet', () => {
        getItem.mockImplementation((key: string) => (key === ONBOARDING_STORAGE_KEY ? LEGACY_DATA : null));
        migrate(ACTIVE_KEY);

        expect(localStorage.removeItem).toHaveBeenCalledWith(ONBOARDING_STORAGE_KEY);
        expect(localStorage.setItem).toHaveBeenCalledWith(ACTIVE_KEY, LEGACY_DATA);
    });

    test('should not migrate onboarding storage if already migrated', () => {
        getItem.mockImplementation((key: string) => (key === ONBOARDING_STORAGE_KEY ? LEGACY_DATA : ACTIVE_DATA));
        migrate(ACTIVE_KEY);

        expect(localStorage.removeItem).toHaveBeenCalledWith(ONBOARDING_STORAGE_KEY);
        expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    test('should noop if nothing to migrate', () => {
        getItem.mockReturnValue(null);
        migrate(ACTIVE_KEY);

        expect(localStorage.removeItem).not.toHaveBeenCalled();
        expect(localStorage.setItem).not.toHaveBeenCalled();
    });
});
