import { SEPARATOR_SPLIT_DUMMY } from './constants';

export const splitEscaped = (s = '', separator = '/') => {
    if (separator !== '/') {
        return s.split(separator);
    }

    return s
        .split('\\/')
        .join(SEPARATOR_SPLIT_DUMMY)
        .split('/')
        .map((s) => s.split(SEPARATOR_SPLIT_DUMMY).join('\\/'));
};

export const escapeSlashes = (s = '') => splitEscaped(s).join('\\/');

export const unescapeSlashes = (s = '') => s.split('\\/').join('/');
