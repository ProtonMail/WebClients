import { stripLeadingAndTrailingSlash, stripTrailingSlash } from '@proton/shared/lib/helpers/string';

export const authenticatedPath = (path: string) => stripTrailingSlash(`/u/*/${stripLeadingAndTrailingSlash(path)}`);
