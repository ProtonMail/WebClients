import { STATUS } from '../../constants';
import { API_CUSTOM_ERROR_CODES } from '../../errors';

/* @ngInject */
function messageRequest(dispatchers, messageApi) {
    const getEditPromise = (type = STATUS.CREATE, parameters) => {
        if (type === STATUS.UPDATE) {
            return messageApi.updateDraft(parameters);
        }
        return messageApi.createDraft(parameters);
    };

    /**
     * Handle the draft request
     * If the user is updating a draft and it does not exist, it creates a new draft.
     * @param {Object} parameters
     * @param {Integer} type
     * @return {Promise}
     */
    async function draft(parameters, message, type) {
        try {
            const { data = {} } = await getEditPromise(type, parameters);
            return data;
        } catch (e) {
            const { data = {} } = e;

            // Case where the user delete draft in an other terminal
            if (data.Code === API_CUSTOM_ERROR_CODES.MESSAGE_UPDATE_DRAFT_NOT_EXIST) {
                delete parameters.id;
                const { data = {} } = await messageApi.createDraft(parameters);
                return data;
            }

            throw e;
        }
    }

    async function send(parameters) {
        const { data = {} } = await messageApi.send(parameters);
        return data;
    }

    return { draft, send };
}
export default messageRequest;
