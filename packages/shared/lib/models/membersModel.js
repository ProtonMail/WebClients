import { queryMembers } from '../api/members';
import updateCollection from '../helpers/updateCollection';
import queryPages from '../api/helpers/queryPages';

export const getMembersModel = (api) => {
    return queryPages((Page, PageSize) => {
        return api(
            queryMembers({
                Page,
                PageSize,
            })
        );
    }).then((pages) => {
        return pages.flatMap(({ Members }) => Members);
    });
};

export const MembersModel = {
    key: 'Members',
    get: getMembersModel,
    update: (model, events) => updateCollection({ model, events, item: ({ Member }) => Member }),
};
