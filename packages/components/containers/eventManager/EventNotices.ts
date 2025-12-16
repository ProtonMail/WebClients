import { useEffect } from 'react';

import { useUser } from '@proton/account/user/hooks';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
import { CryptoProxy } from '@proton/crypto';
import { utf8StringToUint8Array } from '@proton/crypto/lib/utils';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';

const getID = async (text: string) => {
    const id = (
        await CryptoProxy.computeHash({
            algorithm: 'SHA256',
            data: utf8StringToUint8Array(text),
        })
    ).toHex();
    return `NOTICE-${id}`;
};

const serialize = (number: number) => `${number}`;
const deserialize = (string?: string | null) => (string ? +string : 0);
// Two weeks in milliseconds.
const EXPIRATION = 86400 * 1000 * 14;

const EventNotices = () => {
    const { subscribe } = useEventManager();
    const { createNotification } = useNotifications();
    const [user] = useUser();

    useEffect(() => {
        const notify = (text: string) => {
            createNotification({
                type: 'info',
                text,
                expiration: -1,
            });
        };

        const handleNotice = async (text: string) => {
            const id = await getID(`${user.ID}${text}`);

            const oldTimestamp = deserialize(getItem(id));
            const now = Date.now();

            if (!oldTimestamp || now > oldTimestamp) {
                notify(text);
                setItem(id, serialize(now + EXPIRATION));
            }
        };

        return subscribe(({ Notices }) => {
            if (!Array.isArray(Notices)) {
                return;
            }
            Notices.forEach((text) => {
                handleNotice(text);
            });
        });
    }, []);

    return null;
};

export default EventNotices;
