import { itemBuilder } from '../../../lib/items/item.builder';
import { ContentFormatVersion } from '../../../types/crypto/pass-types';
import type { DeobfuscatedItemContent, ItemRevision } from '../../../types/data/items';
import { ItemState } from '../../../types/data/items';
import type { ItemType } from '../../../types/protobuf';
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

type TestItemInit<T extends ItemType> = {
    shareId: string;
    name: string;
    content: Partial<DeobfuscatedItemContent<T>>;
} & Partial<Omit<ItemRevision<T>, 'data'>>;

export const createTestIdentity = ({ name, content, ...init }: TestItemInit<'identity'>): ItemRevision<'identity'> =>
    createTestItem('identity', {
        ...init,
        data: itemBuilder('identity')
            .set('metadata', (metadata) => metadata.set('name', name))
            .set('content', (handler) => handler.merge(content)).data,
    });

export const createTestCreditCard = ({
    name,
    content,
    ...init
}: TestItemInit<'creditCard'>): ItemRevision<'creditCard'> =>
    createTestItem('creditCard', {
        ...init,
        data: itemBuilder('creditCard')
            .set('metadata', (metadata) => metadata.set('name', name))
            .set('content', (handler) => handler.merge(content)).data,
    });
