import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    useLoading,
    Loader,
    useUser,
    useUserKeys,
    useAddresses,
    useAddressesKeys,
    useApi,
    useEventManager
} from 'react-components';
import { markMessageAsUnread } from 'proton-shared/lib/api/messages';

const MessageBody = ({ message = {} }) => {
    const api = useApi();
    const { call } = useEventManager();
    const { Body, AddressID, Time } = message;
    const [body] = useState(Body);
    const [loading, withLoading] = useLoading();
    const [user] = useUser();
    const [addresses, loadingAddresses] = useAddresses();
    const [userKeysList, loadingUserKeys] = useUserKeys(user);
    const [addressesKeysMap, loadingAddressesKeys] = useAddressesKeys(user, addresses, userKeysList);
    const addressKeys = addressesKeysMap[AddressID];

    console.log(addressKeys, Time);

    const markAsUnread = async () => {
        await api(markMessageAsUnread([message.ID]));
        await call();
    };

    const decryptyBody = async () => {
        // updateBody();
        if (message.Unread) {
            markAsUnread() // No await to not slow down the UX
                .then(() => call());
        }
    };

    useEffect(() => {
        withLoading(decryptyBody());
    }, []);

    if (loading || loadingUserKeys || loadingAddresses || loadingAddressesKeys) {
        return <Loader />;
    }

    return <div className="p1" dangerouslySetInnerHTML={{ __html: body }} />;
};

MessageBody.propTypes = {
    message: PropTypes.object.isRequired
};

export default MessageBody;
