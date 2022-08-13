import { PUBLIC_PATH } from '../constants';
import { stripLeadingAndTrailingSlash } from '../helpers/string';
import { getValidatedLocalID } from './sessionForkValidation';

export const getLocalIDPath = (u?: number) => (u === undefined ? undefined : `u/${u}`);

export const getLocalIDFromPathname = (pathname: string) => {
    const maybeLocalID = pathname.match(/^\/?u\/(\d{0,6})\/?/);
    return getValidatedLocalID(maybeLocalID?.[1]);
};

export const getBasename = (localID?: number) => {
    const publicPathBase = stripLeadingAndTrailingSlash(PUBLIC_PATH);
    if (localID === undefined) {
        return publicPathBase ? `/${publicPathBase}` : undefined;
    }
    const localIDPathBase = getLocalIDPath(localID);
    const joined = [publicPathBase, localIDPathBase].filter(Boolean).join('/');
    return joined ? `/${joined}` : undefined;
};

export const stripLocalBasenameFromPathname = (pathname: string) => {
    const localID = getLocalIDFromPathname(pathname);
    const basename = getBasename(localID);
    if (basename) {
        return pathname.slice(basename.length);
    }
    return pathname;
};
