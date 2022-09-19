import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { BasicModalProps } from '@proton/components/components/modalTwo/BasicModal';
import { useApi, useGetCalendarInfo, useNotifications } from '@proton/components/hooks';
import { createPublicLink } from '@proton/shared/lib/api/calendars';
import {
    buildLink,
    generateEncryptedPurpose,
    getCreatePublicLinkPayload,
    transformLinksFromAPI,
} from '@proton/shared/lib/calendar/shareUrl/helpers';
import { ACCESS_LEVEL, CalendarLink, CalendarUrlResponse } from '@proton/shared/lib/interfaces/calendar';
import { splitKeys } from '@proton/shared/lib/keys';

import { BasicModal, Button, Form, InputFieldTwo, Option, SelectTwo } from '../../../components';

interface Props extends Omit<BasicModalProps, 'children' | 'footer'> {
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
    calendarID: string;
}

const defaultAccessLevel = ACCESS_LEVEL.LIMITED;

const ShareLinkModal = ({ onSubmit, onClose, isOpen, calendarID, ...rest }: Props) => {
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
            const { publicKeys } = splitKeys(calendarKeys);

            const encryptedPurpose = purpose ? await generateEncryptedPurpose({ purpose, publicKeys }) : null;

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
            footer={
                <>
                    <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                    <Button type="submit" loading={isLoading} className="mlauto" onClick={handleSubmit} color="norm">{c(
                        'Action'
                    ).t`Create`}</Button>
                </>
            }
            onClose={onClose}
            size="medium"
            as={Form}
        >
            <InputFieldTwo
                label={c('Input label').t`Access`}
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
                label={c('Input label').t`Label (optional)`}
                assistiveText={c('Calendar link sharing label input assistive text').t`Only you can see the label`}
                placeholder={c('Input placeholder').t`Add label`}
            />
        </BasicModal>
    );
};

export default ShareLinkModal;
