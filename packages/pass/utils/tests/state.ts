import { DEFAULT_CLIPBOARD_TTL } from '../../lib/clipboard/types';
import { getVisibleShareIds, intoShareCore } from '../../lib/shares/share.dedupe';
import { bootSuccess } from '../../store/actions/creators/client';
import reducer from '../../store/reducers';
import type { FeatureFlagState, ItemsByShareId, ShareItem } from '../../store/reducers';
import type { SettingsState } from '../../store/reducers/settings';
import type { State } from '../../store/types';
import type { ItemRevision } from '../../types/data/items';

export type TestStateInit = {
    shares?: ShareItem[];
    items?: ItemRevision[];
    settings?: Partial<SettingsState>;
    features?: FeatureFlagState;
    featureVariants?: State['user']['featureVariants'];
};

const indexItems = (items: ItemRevision[]) =>
    items.reduce<ItemsByShareId>((acc, item) => {
        acc[item.shareId] = { ...acc[item.shareId], [item.itemId]: item };
        return acc;
    }, {});

export const createTestState = ({
    shares = [],
    items = [],
    settings = {},
    features,
    featureVariants,
}: TestStateInit = {}): State => {
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
        user: {
            ...state.user,
            ...(features && { features }),
            ...(featureVariants && { featureVariants }),
        },
    };
};
