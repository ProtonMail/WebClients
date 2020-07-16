import createEventManager from '../eventManager/eventManager';
import { UserModel } from './userModel';
import { OrganizationModel } from './organizationModel';
import { SubscriptionModel } from './subscriptionModel';
import { MembersModel } from './membersModel';
import { STATUS } from './cache';

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
    const { status, value: oldValue, promise: oldPromise, dependencies: oldDependencies } = cache.get(key) || {};

    // Only relevant update if it's resolved or pending.
    if (status !== STATUS.RESOLVED && status !== STATUS.PENDING) {
        return;
    }

    // Wait for a pending request to a model to finish before it processes the events for it.
    // e.g. if a model is being dynamically loaded while an update is received.
    const promise = status === STATUS.PENDING ? oldPromise : Promise.resolve(oldValue);
    return promise
        .then(async (value) => {
            const updatedValue = update(value, eventValue);
            cache.set(key, {
                status: STATUS.RESOLVED,
                value: sync ? await sync(api, updatedValue) : updatedValue,
                dependencies: oldDependencies,
            });
        })
        .catch((e) => {
            cache.set(key, {
                status: STATUS.REJECTED,
                value: e,
                dependencies: oldDependencies,
            });
        });
};

/**
 * @param {Object} cache
 * @param {Array} models
 * @param {String} eventID
 * @param {Function} api
 * @returns {Object}
 */
export const setupEventManager = ({ models, cache, eventID, api }) => {
    const modelsMap = models.reduce((acc, model) => {
        return {
            ...acc,
            [model.key]: model,
        };
    }, {});

    const onSuccess = async (data) => {
        const promises = Object.keys(data).reduce((acc, key) => {
            const model = modelsMap[key];
            if (!model) {
                return acc;
            }
            acc.push(resolveModel(cache, api, model, data[key]));
            return acc;
        }, []);

        await Promise.all(promises);

        if (data[UserModel.key]) {
            const { value: user } = cache.get(UserModel.key);
            // Do not get any events for these models, so delete them.
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
        onError,
    });
};
