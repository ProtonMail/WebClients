import { queryConversationCount } from '../api/conversations';
import updateCollection from '../helpers/updateCollection';

export const getConversationCountsModel = (api) => {
    return api(queryConversationCount()).then(({ Counts }) => Counts);
};

export const ConversationCountsModel = {
    key: 'ConversationCounts',
    get: getConversationCountsModel,
    update: (model, events) => updateCollection({ model, events, item: ({ ConversationCounts }) => ConversationCounts })
};
