import queryPages from '@proton/shared/lib/api/helpers/queryPages';
import { queryLogs } from '@proton/shared/lib/api/logs';
import type { AuthLog } from '@proton/shared/lib/authlog';
import type { Api } from '@proton/shared/lib/interfaces';

export const getAllAuthenticationLogs = (api: Api) => {
    return queryPages(
        (Page, PageSize) => {
            return api<{ Logs: AuthLog[]; Total: number }>(
                queryLogs({
                    Page,
                    PageSize,
                })
            );
        },
        { pageSize: 150 }
    ).then((pages) => {
        return pages.flatMap(({ Logs }) => Logs);
    });
};
