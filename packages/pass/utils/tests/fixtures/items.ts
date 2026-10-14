import { itemBuilder } from '../../../lib/items/item.builder';
import type { ItemRevision, ItemType } from '../../../types';
import { ContentFormatVersion, ItemState } from '../../../types';
import { AutofillMode } from '../../../types/protobuf';
import { uniqueId } from '../../string/unique-id';
import { getEpoch } from '../../time/epoch';

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
    folderId: null,
    ...init,
});

export type TestLoginInit = {
    shareId: string;
    name: string;
    email?: string;
    username?: string;
    password?: string;
    urls?: string[];
} & Partial<Omit<ItemRevision<'login'>, 'data'>>;

export const createTestLogin = ({
    name,
    email = '',
    username = '',
    password = '',
    urls = [],
    ...init
}: TestLoginInit): ItemRevision<'login'> =>
    createTestItem('login', {
        ...init,
        data: itemBuilder('login')
            .set('metadata', (metadata) => metadata.set('name', name))
            .set('content', (content) =>
                content
                    .set('itemEmail', email)
                    .set('itemUsername', username)
                    .set('password', password)
                    .set(
                        'autofillUrls',
                        urls.map((url) => ({ url, mode: AutofillMode.Default }))
                    )
            ).data,
    });
