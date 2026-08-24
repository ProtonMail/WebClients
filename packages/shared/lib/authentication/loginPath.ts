import { getParsedPathWithoutLocalIDBasename } from './pathnameHelper';

export const getLoginPath = (basename: string | undefined, oldUrl: string, requestedPath?: string) => {
    return [
        basename || '',
        `/${getParsedPathWithoutLocalIDBasename(requestedPath || '/') || getParsedPathWithoutLocalIDBasename(oldUrl)}`,
    ].join('');
};
