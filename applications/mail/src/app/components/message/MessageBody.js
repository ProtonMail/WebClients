import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useLoading, Loader, useApi, useEventManager } from 'react-components';
import { markMessageAsRead } from 'proton-shared/lib/api/messages';
import { useGetDecryptedMessage } from './hooks/useGetDecryptedMessage';
import { useFormatContent } from './hooks/useFormatContent';

const MessageBody = ({ message = {} }) => {
    const api = useApi();
    const { call } = useEventManager();
    const [body, updateBody] = useState();
    const [loading, withLoading] = useLoading();
    const getDecryptedMessage = useGetDecryptedMessage();
    const formatContent = useFormatContent();

    useEffect(() => {
        const markAsRead = async () => {
            if (message.Unread) {
                await api(markMessageAsRead([message.ID]));
                await call();
            }
        };

        const load = async () => {
            const content = await getDecryptedMessage(message);
            markAsRead(); // No await to not slow down the UX
            const formatted = await formatContent(content, message);
            updateBody(formatted);
        };

        withLoading(load());
    }, []);

    if (loading) {
        return <Loader />;
    }

    return <div className="p1 bodyDecrypted" dangerouslySetInnerHTML={{ __html: body }} />;
};

MessageBody.propTypes = {
    message: PropTypes.object.isRequired
};

export default MessageBody;
