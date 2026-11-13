import { stateHydrate } from '../actions/creators/client';
import { setUIStateValue, unsetUIStateValue } from '../actions/creators/ui';
import { selectCachableState } from '../selectors/cache';
import { selectUIStateValue } from '../selectors/ui';
import { default as rootReducer } from './index';

describe('`ui` reducer', () => {
    const initial = rootReducer(undefined, { type: '__INIT__' });
    const withVault = { ...initial, shares: { shareId: {} as any } };

    const menu = { namespace: 'menuExpanded', key: 'shareId', persist: true } as const;
    const note = { namespace: 'noteExpanded', key: 'itemKey', persist: false } as const;
    const select = (target: typeof menu | typeof note) => selectUIStateValue(target.namespace, target.key, target.persist);

    test('starts empty', () => {
        expect(select(menu)(initial)).toBeUndefined();
        expect(select(note)(initial)).toBeUndefined();
    });

    test('sets and unsets a value per namespace and key', () => {
        const set = rootReducer(initial, setUIStateValue({ ...menu, value: true }));
        expect(select(menu)(set)).toBe(true);
        expect(selectUIStateValue('menuExpanded', 'otherId', true)(set)).toBeUndefined();

        const unset = rootReducer(set, unsetUIStateValue(menu));
        expect(select(menu)(unset)).toBeUndefined();
    });

    test('keeps session and persisted values apart', () => {
        const state = rootReducer(initial, setUIStateValue({ ...menu, value: true }));
        expect(selectUIStateValue('menuExpanded', 'shareId', false)(state)).toBeUndefined();
    });

    test('persisted values survive a cache round-trip, session values do not', () => {
        let state = rootReducer(withVault, setUIStateValue({ ...menu, value: true }));
        state = rootReducer(state, setUIStateValue({ ...note, value: false }));
        const restored = rootReducer(initial, stateHydrate(selectCachableState(state)));

        expect(select(menu)(restored)).toBe(true);
        expect(select(note)(restored)).toBeUndefined();
    });

    test('hydrating a cache written before the session/persisted split starts empty', () => {
        const legacyCache = { ...selectCachableState(initial), ui: { values: {} } };
        const restored = rootReducer(initial, stateHydrate(legacyCache));

        expect(select(menu)(restored)).toBeUndefined();
        expect(select(note)(restored)).toBeUndefined();
    });
});
