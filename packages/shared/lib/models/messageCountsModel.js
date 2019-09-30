import { queryMessageCount } from '../api/messages';
import updateCounter from '../helpers/updateCounter';

export const getMessageCountsModel = (api) => {
    return api(queryMessageCount()).then(({ Counts }) => Counts);
};

export const MessageCountsModel = {
    key: 'MessageCounts',
    get: getMessageCountsModel,
    update: updateCounter
};
