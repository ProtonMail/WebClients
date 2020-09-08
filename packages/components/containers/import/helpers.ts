import { PATH_SPLIT_REGEX } from './constants';

export const escapeSlashes = (s: string) => s.split(PATH_SPLIT_REGEX).join('\\\\/');

export const unescapeSlashes = (s: string) => s.split('\\\\/').join('/');
