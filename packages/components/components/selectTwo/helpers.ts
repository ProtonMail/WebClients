import { normalize } from '@proton/shared/lib/helpers/string';

import type { OptionProps } from '../option/Option';

export const includesString = (str1: string, str2: string | undefined) =>
    normalize(str1, true).includes(normalize(str2, true));

export const arrayIncludesString = (arrayToSearch: string[], keyword: string | undefined) =>
    arrayToSearch.some((str) => includesString(str, keyword));

export const defaultFilterFunction = <V>(option: OptionProps<V>, keyword: string | undefined) =>
    (option.title && includesString(option.title, keyword)) ||
    (option.searchStrings && arrayIncludesString(option.searchStrings, keyword));
