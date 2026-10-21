import type { ItemLatestKeyResponse } from '../../types/api/pass';
import type { SelectedItem } from '../../types/data/items';
import { api } from '../api/api';

/** FIXME: we should start caching the item keys */
export const getLatestItemKey = async ({ shareId, itemId }: SelectedItem): Promise<ItemLatestKeyResponse> =>
    (
        await api({
            url: `pass/v1/share/${shareId}/item/${itemId}/key/latest`,
            method: 'get',
        })
    ).Key!;
