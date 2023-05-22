import { parse } from 'tldts';

import type { Item } from '@proton/pass/types';
import type { ItemMatchFunc } from '@proton/pass/utils/search';
import { matchAny } from '@proton/pass/utils/search';

import { isLoginItem } from '../pass/items';

export const parseLoginItemUrls = ({ content }: Item<'login'>) =>
    content.urls.map((url) => parse(url).hostname).filter(Boolean) as string[];

export const matchLoginItemsByUrl: ItemMatchFunc = (item) => (url: string) =>
    isLoginItem(item) && matchAny(parseLoginItemUrls(item))(url);
