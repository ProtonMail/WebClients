import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import type { BasicModalProps } from '@proton/components/components/modalTwo/BasicModal';
import Option from '@proton/components/components/option/Option';
import { useApi, useGetCalendarInfo, useNotifications } from '@proton/components/hooks';
import { createPublicLink } from '@proton/shared/lib/api/calendars';
import { MAX_CHARS_CLEARTEXT } from '@proton/shared/lib/calendar/constants';
import { getPrimaryCalendarKey } from '@proton/shared/lib/calendar/crypto/keys/helpers';
import {
    buildLink,
    generateEncryptedPurpose,
    getCreatePublicLinkPayload,
    transformLinksFromAPI,
} from '@proton/shared/lib/calendar/sharing/shareUrl/shareUrl';
import type { CalendarLink, CalendarUrlResponse } from '@proton/shared/lib/interfaces/calendar';
import { ACCESS_LEVEL } from '@proton/shared/lib/interfaces/calendar';
import { splitKeys } from '@proton/shared/lib/keys';

import { BasicModal, InputFieldTwo, SelectTwo } from '../../../components';

interface Props extends Omit<BasicModalProps, 'children' | 'footer'> {
    calendarID: string;
    calendarName: string;
    onSubmit: ({
        link,
        transformedLink,
        accessLevel,
    }: {
        link: string;
        transformedLink: CalendarLink[];
        accessLevel: ACCESS_LEVEL;
    }) => Promise<void>;
    onClose: () => void;
    isOpen: boolean;
}

const defaultAccessLevel = ACCESS_LEVEL.LIMITED;

const ShareLinkModal = ({ calendarID, calendarName, onSubmit, onClose, isOpen, ...rest }: Props) => {
    const getCalendarInfo = useGetCalendarInfo();
    const api = useApi();
    const { createNotification } = useNotifications();

    const [isLoading, setIsLoading] = useState(false);
    const [accessLevel, setAccessLevel] = useState<ACCESS_LEVEL>(defaultAccessLevel);
    const [purpose, setPurpose] = useState('');

    const handleError = ({ message }: Error) => createNotification({ type: 'error', text: message });

    const handleSubmit = async () => {
        try {
            setIsLoading(true);
            const { calendarKeys, passphrase, passphraseID } = await getCalendarInfo(calendarID);
            const { publicKey } = getPrimaryCalendarKey(calendarKeys);
            const { publicKeys } = splitKeys(calendarKeys);

            const encryptedPurpose = purpose ? await generateEncryptedPurpose({ purpose, publicKey }) : null;

            const { payload, passphraseKey, cacheKey } = await getCreatePublicLinkPayload({
                accessLevel,
                publicKeys,
                passphrase,
                passphraseID,
                encryptedPurpose,
            });

            const { CalendarUrl } = await api<CalendarUrlResponse>(createPublicLink(calendarID, payload));
            const { CalendarUrlID } = CalendarUrl;
            const link = buildLink({
                urlID: CalendarUrlID,
                accessLevel,
                passphraseKey,
                cacheKey,
            });
            const { privateKeys } = splitKeys(calendarKeys);
            const transformedLink = await transformLinksFromAPI({
                calendarUrls: [CalendarUrl],
                privateKeys,
                calendarPassphrase: passphrase,
                onError: handleError,
            });

            createNotification({ type: 'success', text: c('Info').t`Link created` });
            setIsLoading(false);

            await onSubmit({ link, transformedLink, accessLevel });
            onClose();
        } catch (e: any) {
            setIsLoading(false);
            const error = e instanceof Error ? e : new Error('Failed to generate link');
            throw error;
        }
    };

    useEffect(() => {
        if (!isOpen) {
            setPurpose('');
            setAccessLevel(defaultAccessLevel);
        }
    }, [isOpen]);

    return (
        <BasicModal
            {...rest}
            isOpen={isOpen}
            title={c('Title').t`Create public link`}
            subline={calendarName}
            footer={
                <>
                    <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                    <Button
                        type="submit"
                        loading={isLoading}
                        className="ml-auto"
                        onClick={handleSubmit}
                        color="norm"
                    >{c('Action').t`Create`}</Button>
                </>
            }
            onClose={onClose}
            size="medium"
            as={Form}
        >
            <InputFieldTwo
                label={c('Link label (optional)').t`Access`}
                as={SelectTwo}
                value={accessLevel}
                onValue={(value: any) => setAccessLevel(value)}
            >
                <Option value={0} title={c('Access level').t`Limited view (see only free/busy)`} />
                <Option value={1} title={c('Access level').t`Full view (see all event details)`} />
            </InputFieldTwo>
            <InputFieldTwo
                value={purpose}
                onValue={setPurpose}
                maxLength={MAX_CHARS_CLEARTEXT.PURPOSE}
                label={c('Input label').t`Link label (optional)`}
                assistiveText={c('Calendar link sharing label input assistive text').t`Only you can see the label`}
                placeholder={c('Input placeholder').t`Add label`}
            />
        </BasicModal>
    );
};

export default ShareLinkModal;
