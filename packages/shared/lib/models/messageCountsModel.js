import { queryMessageCount } from '../api/messages';
import updateCollection from '../helpers/updateCollection';

export const getMessageCountsModel = (api) => {
    return api(queryMessageCount()).then(({ Counts }) => Counts);
};

export const MessageCountsModel = {
    key: 'MessageCounts',
    get: getMessageCountsModel,
    update: (model, events) => updateCollection({ model, events, item: ({ MessageCounts }) => MessageCounts })
};
