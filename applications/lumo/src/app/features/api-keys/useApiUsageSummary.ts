import { useEffect, useState } from 'react';

import { useApi } from '@proton/app-context/useApi';

import { getLastUtcDates } from '../../hooks/usePersonalAccessTokenUsage';
import type { UsageScope, UsageSummaryResponse } from '../../remote/usage';
import { getUsageSummaryRequest } from '../../remote/usage';
import { type UsageRow, getUsageRows } from './apiUsage';

const USAGE_HISTORY_DAYS = 90;

type ApiUsageSummaryState = {
    dates: string[];
    rows: UsageRow[];
    isLoading: boolean;
    error: boolean;
};

export const useApiUsageSummary = (scope: UsageScope): ApiUsageSummaryState => {
    const api = useApi();
    const [state, setState] = useState<ApiUsageSummaryState>({ dates: [], rows: [], isLoading: true, error: false });

    useEffect(() => {
        let ignore = false;
        const dates = getLastUtcDates(USAGE_HISTORY_DAYS, new Date());
        setState({ dates: [], rows: [], isLoading: true, error: false });

        api<UsageSummaryResponse>({
            ...getUsageSummaryRequest({
                From: dates[0],
                To: dates[dates.length - 1],
                Scope: scope,
            }),
            silence: true,
        })
            .then((response) => {
                if (!ignore) {
                    setState({
                        dates,
                        rows: getUsageRows(response.Days, response.ClientTypes),
                        isLoading: false,
                        error: false,
                    });
                }
            })
            .catch(() => {
                if (!ignore) {
                    setState({ dates, rows: [], isLoading: false, error: true });
                }
            });

        return () => {
            ignore = true;
        };
    }, [scope]);

    return state;
};
