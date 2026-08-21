import { api } from '@proton/pass/lib/api/api';
import type { ItemLatestKeyResponse, SelectedItem } from '@proton/pass/types';

/** FIXME: we should start caching the item keys */
export const getLatestItemKey = async ({ shareId, itemId }: SelectedItem): Promise<ItemLatestKeyResponse> =>
    (
        await api({
            url: `pass/v1/share/${shareId}/item/${itemId}/key/latest`,
            method: 'get',
        })
    ).Key!;
