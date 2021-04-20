import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { ContactEmailsModel, ContactsModel, DomainsModel, UserModel } from 'proton-shared/lib/models';
import { STATUS } from 'proton-shared/lib/models/cache';
import { SubscriptionModel } from 'proton-shared/lib/models/subscriptionModel';
import { OrganizationModel } from 'proton-shared/lib/models/organizationModel';
import { MembersModel } from 'proton-shared/lib/models/membersModel';
import { EVENT_ERRORS } from 'proton-shared/lib/errors';
import { hasBit } from 'proton-shared/lib/helpers/bitset';
import { AddressesModel } from 'proton-shared/lib/models/addressesModel';
import { KEY as USER_KEYS_CACHE_KEY } from '../../hooks/useUserKeys';
import { CACHE_KEY as ADDRESS_KEYS_CACHE } from '../../hooks/useGetAddressKeys';
import { KEY as ADDRESSES_KEYS_CACHE } from '../../hooks/useAddressesKeys';
import { useEventManager, useCache } from '../../hooks';

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

            // The API some times does not send the user model when used space changes...
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
