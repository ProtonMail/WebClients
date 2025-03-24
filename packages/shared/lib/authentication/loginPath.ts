import { getParsedPathWithoutLocalIDBasename } from '@proton/shared/lib/authentication/pathnameHelper';

export const getLoginPath = (basename: string | undefined, oldUrl: string, requestedPath?: string) => {
    return [
        basename || '',
        `/${getParsedPathWithoutLocalIDBasename(requestedPath || '/') || getParsedPathWithoutLocalIDBasename(oldUrl)}`,
    ].join('');
};
