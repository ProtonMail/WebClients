import { DEFAULT_CLIPBOARD_TTL } from '../../lib/clipboard/types';
import { getVisibleShareIds, intoShareCore } from '../../lib/shares/share.dedupe';
import { bootSuccess } from '../../store/actions';
import reducer from '../../store/reducers';
import type { ItemsByShareId, ShareItem } from '../../store/reducers';
import type { SettingsState } from '../../store/reducers/settings';
import type { State } from '../../store/types';
import type { ItemRevision } from '../../types';

export type TestStateInit = {
    shares?: ShareItem[];
    items?: ItemRevision[];
    settings?: Partial<SettingsState>;
};

const indexItems = (items: ItemRevision[]) =>
    items.reduce<ItemsByShareId>((acc, item) => {
        acc[item.shareId] = { ...acc[item.shareId], [item.itemId]: item };
        return acc;
    }, {});

export const createTestState = ({ shares = [], items = [], settings = {} }: TestStateInit = {}): State => {
    const state = reducer(
        undefined,
        bootSuccess({
            v: 1,
            shares: Object.fromEntries(shares.map((share) => [share.shareId, share])),
            items: indexItems(items),
            folders: {},
            dedupe: getVisibleShareIds(shares.map(intoShareCore)),
        })
    );

    return {
        ...state,
        settings: { ...state.settings, clipboard: { timeoutMs: DEFAULT_CLIPBOARD_TTL }, ...settings },
    };
};
