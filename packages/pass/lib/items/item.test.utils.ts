import type { ItemRevision, ItemType } from '../../types';
import { ContentFormatVersion, ItemState } from '../../types';
import { uniqueId } from '../../utils/string/unique-id';
import { getEpoch } from '../../utils/time/epoch';
import { itemBuilder } from './item.builder';

export const createTestItem = <T extends ItemType>(type: T, init: Partial<ItemRevision<T>> = {}): ItemRevision<T> => ({
    aliasEmail: null,
    contentFormatVersion: ContentFormatVersion.Item,
    createTime: getEpoch(),
    itemId: uniqueId(),
    lastUseTime: getEpoch(),
    modifyTime: getEpoch(),
    pinned: false,
    flags: 0,
    revision: 1,
    revisionTime: getEpoch(),
    state: ItemState.Active,
    data: itemBuilder(type).data,
    shareId: uniqueId(),
    shareCount: 0,
    ...init,
});
