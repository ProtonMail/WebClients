import { getLatestID } from '../api/events';
import createEventManager from '../eventManager/eventManager';
import { UserModel } from './userModel';
import { UserSettingsModel } from './userSettingsModel';
import { MailSettingsModel } from './mailSettingsModel';
import { AddressesModel } from './addressesModel';
import { OrganizationModel } from './organizationModel';
import { SubscriptionModel } from './subscriptionModel';
import { LabelsModel } from './labelsModel';
import { FiltersModel } from './filtersModel';
import { MembersModel } from './membersModel';
import { STATUS } from './cache';

// TODO: Should list all models.
const MODELS_MAP = [
    UserModel,
    UserSettingsModel,
    MailSettingsModel,
    AddressesModel,
    LabelsModel,
    FiltersModel,
    SubscriptionModel,
    OrganizationModel,
    MembersModel
].reduce((acc, model) => {
    acc[model.key] = model;
    return acc;
}, {});

export const getEventID = (api) => api(getLatestID()).then(({ EventID }) => EventID);

/**
 * Resolve a model when receiving a new event for it.
 * @param {Object} cache
 * @param {Function} api
 * @param {Object} model
 * @param {any} eventValue
 * @returns {Promise}
 */
const resolveModel = (cache, api, model, eventValue) => {
    const { key, update, sync } = model;
    const { status, value: oldValue } = cache.get(key) || {};

    // Only relevant update if it's resolved or pending.
    if (status !== STATUS.RESOLVED && status !== STATUS.PENDING) {
        return;
    }

    // Wait for a pending request to a model to finish before it processes the events for it.
    // e.g. if a model is being dynamically loaded while an update is received.
    const promise = status === STATUS.PENDING ? oldValue : Promise.resolve(oldValue);
    return promise
        .then(async (value) => {
            const updatedValue = update(value, eventValue);
            cache.set(key, {
                status: STATUS.RESOLVED,
                value: model.sync ? await sync(api, updatedValue) : updatedValue
            });
        })
        .catch((e) => {
            cache.set(key, {
                status: STATUS.REJECTED,
                value: e
            });
        });
};

/**
 * @param {Object} cache
 * @param {String} eventID
 * @param {Function} api
 * @returns {Object}
 */
export const setupEventManager = (cache, eventID, api) => {
    const onSuccess = async (data) => {
        const promises = Object.keys(data).reduce((acc, key) => {
            const model = MODELS_MAP[key];
            if (!model) {
                return acc;
            }
            acc.push(resolveModel(cache, api, model, data[key]));
            return acc;
        }, []);

        await Promise.all(promises);

        // If new user, check the subscription
        // TODO: Need to set a fake organization, subscription etc in case a view is already opened.
        // Otherwise it would refetch and error out.
        if (data[UserModel.key]) {
            const { value: user } = cache.get(UserModel.key);
            if (user.isFree) {
                cache.delete(SubscriptionModel.key);
                cache.delete(OrganizationModel.key);
                cache.delete(MembersModel.key);
            }
        }
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
