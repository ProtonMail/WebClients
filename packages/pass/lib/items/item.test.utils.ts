import type { ItemRevision, ItemType } from '@proton/pass/types';
import { ContentFormatVersion, ItemState } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/epoch';

import { itemBuilder } from './item.builder';

export const createTestItem = (type: ItemType, init: Partial<ItemRevision> = {}): ItemRevision => ({
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
    ...init,
});
