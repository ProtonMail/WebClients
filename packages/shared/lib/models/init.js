import { getLatestID } from '../api/events';
import createCache from '../state/state';
import createEventManager from '../eventManager/eventManager';

import { UserModel } from './userModel';
import { UserSettingsModel } from './userSettingsModel';
import { MailSettingsModel } from './mailSettingsModel';
import { AddressesModel } from './addressesModel';
import { OrganizationModel } from './organizationModel';
import { SubscriptionModel } from './subscriptionModel';
import { MembersModel } from './membersModel';

const getEventId = (api) => api(getLatestID()).then(({ EventID }) => EventID);

const prefetchModels = async (api, models = []) => {
    const result = await Promise.all(models.map(({ get }) => get(api)));
    // eslint-disable-next-line
    console.log(result);
    return models.reduce((acc, { key }, i) => {
        acc[key] = result[i];
        return acc;
    }, {});
};

const createHandleUpdateEvents = (api, models) => async (state, data) => {
    const run = ({ key, update, sync }) => {
        const dataValue = data[key];
        const oldValue = state[key];
        if (!dataValue) {
            return;
        }
        const newValue = update(oldValue, dataValue);
        return sync ? sync(api, newValue) : newValue;
    };

    const result = await Promise.all(models.map(run));

    return models.reduce((acc, { key }, i) => {
        const newValue = result[i];
        if (!newValue) {
            return acc;
        }
        acc[key] = newValue;
        return acc;
    }, state);
};

/**
 * TODO: Make the models to fetch customizable.
 * @param {Object} user
 * @param {Function} api
 * @returns {Promise}
 */
export const setupCatche = async (user, api) => {
    const modelsToPrefetch = [
        UserSettingsModel,
        MailSettingsModel,
        AddressesModel,
        !user.isFree && SubscriptionModel,
        user.hasOrganization && OrganizationModel,
        user.hasOrganization && MembersModel
    ].filter(Boolean);

    const result = await prefetchModels(api, modelsToPrefetch);

    return createCache({
        [UserModel.key]: user,
        ...result
    });
};

/**
 * TODO: Make the models to listen customizable.
 * @param {Object} cache
 * @param {String} eventID
 * @param {Function} api
 * @returns {Promise}
 */
export const setupEventManager = (cache, eventID, api) => {
    const modelsToListen = [
        UserModel,
        UserSettingsModel,
        MailSettingsModel,
        AddressesModel,
        SubscriptionModel,
        OrganizationModel,
        MembersModel
    ];

    const handleUpdateEvents = createHandleUpdateEvents(api, modelsToListen);

    const onSuccess = async (data) => {
        const oldState = cache.get();
        const newState = await handleUpdateEvents(oldState, data);

        const { User } = newState;

        // Necessary because there is no delete event for organizations
        if (!User.hasOrganization) {
            delete newState[OrganizationModel.key];
            delete newState[MembersModel.key];
        }

        // TODO: same as above?
        if (User.isFree) {
            delete newState[SubscriptionModel.key];
        }

        // eslint-disable-next-line
        console.log('event manager success', oldState, newState);

        cache.set(newState);
    };

    const onError = (e) => {
        // eslint-disable-next-line
        console.log('event manager error', e);
    };

    return createEventManager({
        api,
        eventID,
        onSuccess,
        onError
    });
};

export const createInit = (loginData = {}) => (api) => {
    return Promise.all([loginData.userResult || UserModel.get(api), loginData.initialEventID || getEventId(api)]);
};
