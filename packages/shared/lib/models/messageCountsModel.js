import { queryMessageCount } from '../api/messages';

export const getMessageCountsModel = (api) => {
    return api(queryMessageCount()).then(({ Counts }) => Counts);
};

export const MessageCountsModel = {
    key: 'MessageCounts',
    get: getMessageCountsModel,
    update(model, events) {
        return events;
    }
};
