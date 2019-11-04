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
import { markMessageAsRead } from 'proton-shared/lib/api/messages';

const MessageBody = ({ message = {} }) => {
    const api = useApi();
    const { call } = useEventManager();
    const { Body, AddressID, Time } = message;
    const [body, updateBody] = useState(Body);
    const [loading, withLoading] = useLoading();
    const [user] = useUser();
    const [addresses, loadingAddresses] = useAddresses();
    const [userKeysList, loadingUserKeys] = useUserKeys(user);
    const [addressesKeysMap, loadingAddressesKeys] = useAddressesKeys(user, addresses, userKeysList);
    const addressKeys = addressesKeysMap[AddressID];

    console.log(addressKeys, Time);

    const markAsRead = async () => {
        if (message.Unread) {
            await api(markMessageAsRead([message.ID]));
            await call();
        }
    };

    const decryptyBody = async () => {};

    const formatContent = async (content) => {
        return content;
    };

    useEffect(() => {
        const promise = decryptyBody()
            .then((content) => {
                markAsRead(); // No await to not slow down the UX
                return formatContent(content);
            })
            .then(updateBody);

        withLoading(promise);
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
