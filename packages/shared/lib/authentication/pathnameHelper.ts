import { stripLeadingAndTrailingSlash, stripLeadingSlash } from '../helpers/string';
import { PUBLIC_PATH } from '../webpack.constants';
import { getValidatedLocalID } from './fork/validation';

export const getLocalIDPath = (u?: number) => (u === undefined ? undefined : `u/${u}`);

export const getLocalIDFromPathname = (pathname: string) => {
    const maybeLocalID = pathname.match(/^\/?u\/([^/]+)\/?/)?.[1];
    return getValidatedLocalID(maybeLocalID);
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

export const stripLocalBasenameFromPathname = (pathname: string): string => {
    const strippedPathname = stripLeadingSlash(pathname);

    if (strippedPathname === 'u') {
        return '/';
    }

    const userPrefix = 'u/';
    if (strippedPathname.startsWith(userPrefix)) {
        // Strip out the 'u/' part
        let value = stripLeadingSlash(strippedPathname.slice(userPrefix.length));

        const localID = getLocalIDFromPathname(`${userPrefix}${value}`);
        // If there is a valid local id, also strip out that
        if (localID !== undefined) {
            value = value.slice(`${localID}`.length);
        }

        // Keep stripping /u prefix if it exists
        return stripLocalBasenameFromPathname(value);
    }

    return `/${strippedPathname}`;
};
