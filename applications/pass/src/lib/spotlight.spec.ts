import { migrate } from 'proton-pass-web/lib/spotlight';
import { SPOTLIGHT_STORAGE_KEY, getSpotlightStorageKey } from 'proton-pass-web/lib/storage';

vi.mock('proton-pass-web/app/Store/store', () => ({ store: {} }));

const LEGACY_DATA = JSON.stringify({ legacy: true });
const ACTIVE_DATA = JSON.stringify({ legacy: false });
const ACTIVE_KEY = getSpotlightStorageKey(0);

describe('spotlight', () => {
    /** happy-dom binds the `Storage` methods when `localStorage` is first read (on import):
     * spying on the prototype afterwards is not seen, so the storage is replaced */
    const getItem = vi.fn();
    const setItem = vi.fn();
    const removeItem = vi.fn();
    vi.stubGlobal('localStorage', { getItem, setItem, removeItem });

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

        expect(removeItem).toHaveBeenCalledWith(SPOTLIGHT_STORAGE_KEY);
        expect(setItem).toHaveBeenCalledWith(ACTIVE_KEY, LEGACY_DATA);
    });

    test('should not migrate spotlight storage if already migrated', () => {
        getItem.mockImplementation((key: string) => (key === SPOTLIGHT_STORAGE_KEY ? LEGACY_DATA : ACTIVE_DATA));
        migrate(ACTIVE_KEY);

        expect(removeItem).toHaveBeenCalledWith(SPOTLIGHT_STORAGE_KEY);
        expect(setItem).not.toHaveBeenCalled();
    });

    test('should noop if nothing to migrate', () => {
        getItem.mockReturnValue(null);
        migrate(ACTIVE_KEY);

        expect(removeItem).not.toHaveBeenCalled();
        expect(setItem).not.toHaveBeenCalled();
    });
});
