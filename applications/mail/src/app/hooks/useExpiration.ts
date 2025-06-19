import { useEffect, useState } from 'react';

import { differenceInHours, isAfter } from 'date-fns';
import { c } from 'ttag';

import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { MINUTE } from '@proton/shared/lib/constants';

import {
    getAutoDeleteOnMessage,
    getExpiresOnMessage,
    getMessageExpirationDate,
} from '../helpers/message/messageExpirationTime';

const useExpiration = (message: MessageState, autoDelete = false) => {
    const [expiresInLessThan24Hours, setExpiresInLessThan24Hours] = useState(false);
    const [expirationMessage, setExpirationMessage] = useState('');

    const expirationDate = getMessageExpirationDate(message);

    useEffect(() => {
        const interval = () => {
            if (!expirationDate) {
                setExpiresInLessThan24Hours(false);
                setExpirationMessage('');
                return;
            }

            const now = new Date();
            if (differenceInHours(expirationDate, now) < 24) {
                setExpiresInLessThan24Hours(true);
            }

            if (isAfter(now, expirationDate)) {
                const message = c('Info').t`The message has expired`;
                setExpirationMessage(message);
                return;
            }

            if (autoDelete) {
                setExpirationMessage(getAutoDeleteOnMessage(expirationDate));
                return;
            }

            setExpirationMessage(getExpiresOnMessage(expirationDate));
        };

        interval();

        const intervalID = window.setInterval(interval, MINUTE);
        return () => clearInterval(intervalID);
    }, []);

    return { expirationMessage, expiresInLessThan24Hours, expirationDate };
};

export default useExpiration;
