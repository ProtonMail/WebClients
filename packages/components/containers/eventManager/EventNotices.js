import { useEffect } from 'react';
import { useEventManager, useNotifications, useUser } from 'react-components';
import { arrayToHexString, binaryStringToArray, encodeUtf8, unsafeMD5 } from 'pmcrypto';
import { getItem, setItem } from 'proton-shared/lib/helpers/storage';

const getID = async (text) => {
    const id = arrayToHexString(await unsafeMD5(binaryStringToArray(encodeUtf8(text))));
    return `NOTICE-${id}`;
};

const serialize = (number) => '' + number;
const deserialize = (string) => (string ? +string : 0);
// Two weeks in milliseconds.
const EXPIRATION = 86400 * 1000 * 14;

const EventNotices = () => {
    const { subscribe } = useEventManager();
    const { createNotification } = useNotifications();
    const [user] = useUser();

    useEffect(() => {
        const notify = (text) => {
            createNotification({
                type: 'info',
                text,
                expiration: -1,
            });
        };

        const handleNotice = async (text) => {
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
            Notices.forEach(handleNotice);
        });
    }, []);

    return null;
};

export default EventNotices;
