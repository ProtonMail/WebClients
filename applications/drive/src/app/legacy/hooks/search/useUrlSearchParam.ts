import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';

const parseHashParams = (urlHash: string) => {
    const result: Record<string, string> = {};

    return urlHash
        .slice(1)
        .split('&')
        .reduce(function (res, item) {
            const [key, value] = item.split('=');
            res[key] = value;
            return res;
        }, result);
};

const extractSearchParameters = (hash: string): string => {
    const hashParams = parseHashParams(hash);
    const { q } = hashParams;
    return q ? decodeURIComponent(q) : '';
};

export const useUrlSearchParams = () => {
    const { hash } = useLocation();

    const [searchParams, setSearchParams] = useState<string>('');

    useEffect(() => {
        setSearchParams(extractSearchParameters(hash));
    }, [hash]);

    return [searchParams, setSearchParams] as [string, Dispatch<SetStateAction<string>>];
};
