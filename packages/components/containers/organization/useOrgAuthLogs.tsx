import { useEffect, useState } from 'react';

import { useErrorHandler } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { getOrgAuthLogs } from '@proton/shared/lib/api/b2blogs';

import type { AuthLogsQueryParams } from './AuthenticationLogs';

const getFormattedQueryString = (params: { [key: string]: any }) => {
    const queryParts: string[] = [];

    Object.keys(params).forEach((key) => {
        const value = params[key];
        if (value === undefined) {
            return;
        }
        if (Array.isArray(value)) {
            value.forEach((item) => {
                queryParts.push(`${key}[]=${encodeURIComponent(item)}`);
            });
        } else {
            queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
        }
    });

    return queryParts.join('&');
};

const useOrgAuthLogs = (api: any, query: AuthLogsQueryParams, page: number) => {
    const handleError = useErrorHandler();
    const [authLogs, setAuthLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, withLoading] = useLoading();
    const [error, setError] = useState<string | undefined>(undefined);

    const fetchAuthLogs = async () => {
        if (!query.Emails.length) {return;}
        setError(undefined);

        try {
            const queryString = getFormattedQueryString({ ...query, Page: page - 1, PageSize: 10 });
            const { Items, Total } = await api(getOrgAuthLogs(queryString));
            const data = Items.map((item: any) => item.Data);
            setAuthLogs(data);
            setTotal(Total || 0);

            if (Total === 0) {
                setError('No logs exist for this query.');
            }
        } catch (e) {
            handleError(e);
            setError('Failed to fetch logs.');
        }
    };

    useEffect(() => {
        void withLoading(fetchAuthLogs());
    }, [page, query]);

    return { authLogs, total, loading, error };
};

export default useOrgAuthLogs;
