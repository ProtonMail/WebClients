import { objectDelete } from '../../utils/object/delete';
import { stateHydrate } from '../actions/creators/client';
import { setFolderExpanded } from '../actions/creators/folder-expanded';
import { selectCachableState } from '../selectors/cache';
import { selectIsFolderExpanded } from '../selectors/folder-expanded';
import { default as rootReducer } from './index';

describe('`folderExpanded` reducer', () => {
    const initial = rootReducer(undefined, { type: '__INIT__' });

    test('vaults and folders start collapsed', () => {
        expect(selectIsFolderExpanded('shareId')(initial)).toBe(false);
    });

    test('expands and collapses by id', () => {
        const expanded = rootReducer(initial, setFolderExpanded({ id: 'folderId', expanded: true }));
        expect(selectIsFolderExpanded('folderId')(expanded)).toBe(true);
        expect(selectIsFolderExpanded('otherId')(expanded)).toBe(false);

        const collapsed = rootReducer(expanded, setFolderExpanded({ id: 'folderId', expanded: false }));
        expect(selectIsFolderExpanded('folderId')(collapsed)).toBe(false);
    });

    test('survives a cache round-trip', () => {
        const state = rootReducer(initial, setFolderExpanded({ id: 'shareId', expanded: true }));
        const restored = rootReducer(initial, stateHydrate(selectCachableState(state)));
        expect(selectIsFolderExpanded('shareId')(restored)).toBe(true);
    });

    test('hydrating a cache from before this slice existed starts collapsed', () => {
        const legacyCache = objectDelete(selectCachableState(initial), 'folderExpanded');
        const restored = rootReducer(initial, stateHydrate(legacyCache));
        expect(selectIsFolderExpanded('shareId')(restored)).toBe(false);
    });
});
