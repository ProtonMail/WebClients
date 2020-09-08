import { PATH_SPLIT_REGEX } from './constants';

export const escapeSlashes = (s = '') => s.split(PATH_SPLIT_REGEX).join('\\/');

export const unescapeSlashes = (s = '') => s.split('\\/').join('/');
