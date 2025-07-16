import type { LocationDescriptorObject } from 'history';

/**
 * The location descriptor object pathname may not contain search params. To avoid creating descriptor objects such as
 * { pathname: paths.signup } -> { pathname: '/signup?plan=free' }, this sanitization step is added to ensure that it's
 * in a separate search key.
 */
export const getSanitizedLocationDescriptorObject = (location: LocationDescriptorObject): LocationDescriptorObject => {
    if (!location.pathname) {
        return location;
    }
    const url = new URL(location.pathname, window.location.origin);
    if (!url.search) {
        return location;
    }
    const parsedSearch = new URLSearchParams(location.search);
    parsedSearch.forEach((value, key) => {
        url.searchParams.set(key, value);
    });
    return {
        ...location,
        pathname: url.pathname,
        search: url.search,
    };
};
