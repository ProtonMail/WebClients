import { queryConversationCount } from '../api/conversations';

export const getConversationCountsModel = (api) => {
    return api(queryConversationCount()).then(({ Counts }) => Counts);
};

export const ConversationCountsModel = {
    key: 'ConversationCounts',
    get: getConversationCountsModel,
    update(model, events) {
        return events;
    }
};
