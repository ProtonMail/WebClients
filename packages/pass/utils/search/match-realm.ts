import type { Item, ItemType } from '@proton/pass/types';
import type { ItemMatchFunc } from '@proton/pass/utils/search';
import { matchAny } from '@proton/pass/utils/search';

import { prop, truthy } from '../fp';
import { isLoginItem } from '../pass/items';
import { parseUrl } from '../url';

export const parseLoginItemUrls = ({ content }: Item<'login'>, isSecure: boolean) =>
    content.urls
        .map((url) => parseUrl(url))
        .filter((itemUrl) => isSecure || !itemUrl.isSecure)
        .map(prop('hostname'))
        .filter(truthy);

export const matchLoginItemsByUrl: ItemMatchFunc<ItemType, boolean> = (item) => (url: string, isSecure?: boolean) =>
    isLoginItem(item) && matchAny(parseLoginItemUrls(item, isSecure ?? true))(url);
