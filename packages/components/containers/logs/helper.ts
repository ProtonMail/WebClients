import { queryLogs } from 'proton-shared/lib/api/logs';
import queryPagesThrottled from 'proton-shared/lib/api/helpers/queryPagesThrottled';
import { Api } from 'proton-shared/lib/interfaces';
import { AuthLog } from 'proton-shared/lib/authlog';

export const getAllAuthenticationLogs = (api: Api) => {
    const pageSize = 150;

    const requestPage = (Page: number) =>
        api<{ Logs: AuthLog[]; Total: number }>(
            queryLogs({
                Page,
                PageSize: pageSize,
            })
        );

    return queryPagesThrottled({
        requestPage,
        pageSize,
        pagesPerChunk: 10,
        delayPerChunk: 100,
    }).then((pages) => {
        return pages.map(({ Logs }) => Logs).flat();
    });
};
