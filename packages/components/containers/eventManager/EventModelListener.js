import { useEffect } from 'react';

import PropTypes from 'prop-types';

import { EVENT_ERRORS } from '@proton/shared/lib/errors';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import {
    ContactEmailsModel,
    ContactsModel,
    DomainsModel,
    HolidaysCalendarsModel,
    UserModel,
    UserSettingsModel,
} from '@proton/shared/lib/models';
import { AddressesModel } from '@proton/shared/lib/models/addressesModel';
import { STATUS } from '@proton/shared/lib/models/cache';
import { MembersModel } from '@proton/shared/lib/models/membersModel';
import { OrganizationModel } from '@proton/shared/lib/models/organizationModel';
import { SubscriptionModel } from '@proton/shared/lib/models/subscriptionModel';

import { useCache, useEventManager } from '../../hooks';
import { KEY as ADDRESSES_KEYS_CACHE } from '../../hooks/useAddressesKeys';
import { CACHE_KEY as ADDRESS_KEYS_CACHE } from '../../hooks/useGetAddressKeys';
import { KEY as USER_KEYS_CACHE_KEY } from '../../hooks/useUserKeys';

const EventModelListener = ({ models }) => {
    const { subscribe } = useEventManager();
    const cache = useCache();

    useEffect(() => {
        const modelsMap = models.reduce((acc, model) => {
            return {
                ...acc,
                [model.key]: model,
            };
        }, {});

        return subscribe((data) => {
            /**
             * Before updating model values
             */
            if (data[UserSettingsModel.key]) {
                const oldUserSettingsRecord = cache.get(UserSettingsModel.key);
                if (oldUserSettingsRecord?.value.Locale !== data[UserSettingsModel.key].Locale) {
                    // The directory of holidays calendars is fetched translated from back-end, so when the app language
                    // is changed we need to clear the cache so that next time they're requested we fetch them in the new language
                    cache.delete(HolidaysCalendarsModel.key);
                }
            }

            /**
             * Update model values
             */
            for (const key of Object.keys(data)) {
                const model = modelsMap[key];
                if (!model) {
                    continue;
                }

                const { value: oldValue, status } = cache.get(key) || {};

                if (status === STATUS.RESOLVED) {
                    cache.set(key, {
                        status: STATUS.RESOLVED,
                        value: model.update(oldValue, data[key]),
                    });
                }
            }

            /**
             * After updating model values
             */
            if (hasBit(data.Refresh, EVENT_ERRORS.CONTACTS)) {
                cache.delete(ContactsModel.key);
                cache.delete(ContactEmailsModel.key);
            }

            // If user model was changed.
            if (data[UserModel.key]) {
                const { value: user } = cache.get(UserModel.key);
                // Do not get any events for these models, so delete them.
                if (user.isFree) {
                    cache.delete(SubscriptionModel.key);
                    cache.delete(OrganizationModel.key);
                    cache.delete(DomainsModel.key);
                    cache.delete(MembersModel.key);
                }
                // Since the keys could have changed, clear the cached keys.
                cache.delete(USER_KEYS_CACHE_KEY);
            }

            if (data[AddressesModel.key]) {
                // TODO: Be smarter and just delete the address keys that changed
                // Since the keys could have changed, clear the cached keys.
                cache.delete(ADDRESS_KEYS_CACHE);
                cache.delete(ADDRESSES_KEYS_CACHE);
            }

            // The API sometimes does not send the user model when used space changes...
            if (data.UsedSpace !== undefined) {
                const oldUserRecord = cache.get(UserModel.key);
                cache.set(UserModel.key, {
                    ...oldUserRecord,
                    value: {
                        ...oldUserRecord.value,
                        UsedSpace: data.UsedSpace,
                    },
                });
            }
        });
    }, []);

    return null;
};

EventModelListener.propTypes = {
    models: PropTypes.array.isRequired,
};

export default EventModelListener;
