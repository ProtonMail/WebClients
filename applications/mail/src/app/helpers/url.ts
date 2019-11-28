import { Location } from 'history';

export const getSearchParams = (location: Location): { [key: string]: string } => {
    const params = new URLSearchParams(location.search);

    const result: { [key: string]: string } = {};

    params.forEach((value, key) => {
        result[key] = value;
    });

    return result;
};

export const changeSearchParams = (location: Location, newParams: { [key: string]: string | undefined }) => {
    const params = new URLSearchParams(location.search);

    for (const key in newParams) {
        if (newParams[key] === undefined) {
            params.delete(key);
        } else {
            params.set(key, newParams[key] as string);
        }
    }

    const queryString = params.toString();
    const urlFragment = (queryString === '' ? '' : '?') + queryString;

    return location.pathname + urlFragment;
};
