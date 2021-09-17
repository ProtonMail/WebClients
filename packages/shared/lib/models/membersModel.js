import { queryMembers } from '../api/members';
import updateCollection from '../helpers/updateCollection';
import queryPagesThrottled from '../api/helpers/queryPagesThrottled';

export const getMembersModel = (api) => {
    const pageSize = 100;

    const requestPage = (page) => {
        return api(
            queryMembers({
                Page: page,
                PageSize: pageSize,
            })
        );
    };

    return queryPagesThrottled({
        requestPage,
        pageSize,
        pagesPerChunk: 10,
        delayPerChunk: 100,
    }).then((pages) => {
        return pages.map(({ Members }) => Members).flat();
    });
};

export const MembersModel = {
    key: 'Members',
    get: getMembersModel,
    update: (model, events) => updateCollection({ model, events, item: ({ Member }) => Member }),
};
