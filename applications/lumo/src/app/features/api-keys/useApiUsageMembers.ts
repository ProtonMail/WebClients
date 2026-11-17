import { useEffect, useState } from 'react';

import { useApi } from '@proton/app-context/useApi';

import type { UsageMemberRow, UsageMembersResponse } from '../../remote/usage';
import { getUsageMembersRequest } from '../../remote/usage';

type ApiUsageMembersState = {
    rows: UsageMemberRow[];
    isLoading: boolean;
    error: boolean;
};

export const useApiUsageMembers = (from: string | undefined, to: string | undefined): ApiUsageMembersState => {
    const api = useApi();
    const [state, setState] = useState<ApiUsageMembersState>({ rows: [], isLoading: true, error: false });

    useEffect(() => {
        if (!from || !to) {
            return;
        }
        let ignore = false;
        setState({ rows: [], isLoading: true, error: false });

        api<UsageMembersResponse>({
            ...getUsageMembersRequest({ From: from, To: to, ClientType: 'api' }),
            silence: true,
        })
            .then((response) => {
                if (!ignore) {
                    setState({ rows: response.Members, isLoading: false, error: false });
                }
            })
            .catch(() => {
                if (!ignore) {
                    setState({ rows: [], isLoading: false, error: true });
                }
            });

        return () => {
            ignore = true;
        };
    }, [from, to]);

    return state;
};
