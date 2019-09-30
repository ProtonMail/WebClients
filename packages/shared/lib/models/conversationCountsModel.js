import { queryConversationCount } from '../api/conversations';
import updateCounter from '../helpers/updateCounter';

export const getConversationCountsModel = (api) => {
    return api(queryConversationCount()).then(({ Counts }) => Counts);
};

export const ConversationCountsModel = {
    key: 'ConversationCounts',
    get: getConversationCountsModel,
    update: updateCounter
};
