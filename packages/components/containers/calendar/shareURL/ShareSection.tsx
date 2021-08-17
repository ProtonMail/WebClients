import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { MouseEvent, useState } from 'react';
import { c } from 'ttag';
import { Calendar, ACCESS_LEVEL, CalendarUrlResponse } from '@proton/shared/lib/interfaces/calendar';

import {
    buildLink,
    generateEncryptedPurpose,
    getCreatePublicLinkPayload,
} from '@proton/shared/lib/calendar/shareUrl/helpers';
import { createPublicLink, deletePublicLink, editPublicLink } from '@proton/shared/lib/api/calendars';
import { splitKeys } from '@proton/shared/lib/keys';
import { Nullable, SimpleMap } from '@proton/shared/lib/interfaces/utils';
import { UserModel } from '@proton/shared/lib/interfaces';
import { useApi, useGetCalendarInfo, useModals, useNotifications } from '../../../hooks';
import { useCalendarModelEventManager } from '../../eventManager';

import LinkTable from './LinkTable';
import ShareTable from './ShareTable';
import ShareLinkSuccessModal from './ShareLinkSuccessModal';
import DeleteLinkConfirmationModal from './DeleteLinkConfirmationModal';
import EditLinkModal from './EditLinkModal';
import { Alert, Loader } from '../../../components';
import useCalendarShareUrls from './useCalendarShareUrls';
import { SettingsParagraph, SettingsSection } from '../../account';

interface Props {
    defaultCalendar?: Calendar;
    calendars: Calendar[];
    user: UserModel;
}

const ShareSection = ({ calendars, defaultCalendar, user }: Props) => {
    const { linksMap, isLoadingLinks } = useCalendarShareUrls(calendars);
    const [isLoadingCreate, setIsLoadingCreate] = useState(false);
    const [isLoadingMap, setIsLoadingMap] = useState<SimpleMap<boolean>>({});
    const api = useApi();
    const { createNotification } = useNotifications();
    const getCalendarInfo = useGetCalendarInfo();
    const { createModal } = useModals();
    const { call } = useCalendarModelEventManager();
    const notifyLinkCopied = () => {
        createNotification({ type: 'info', text: c('Info').t`Link copied to clipboard` });
    };

    const handleCreateLink = async ({ accessLevel, calendarID }: { accessLevel: ACCESS_LEVEL; calendarID: string }) => {
        setIsLoadingCreate(true);
        const { decryptedCalendarKeys, decryptedPassphrase, passphraseID } = await getCalendarInfo(calendarID);
        const { publicKeys } = splitKeys(decryptedCalendarKeys);

        const { payload, passphraseKey, cacheKey } = await getCreatePublicLinkPayload({
            accessLevel,
            publicKeys,
            decryptedPassphrase,
            passphraseID,
        });

        const {
            CalendarUrl: { CalendarUrlID },
        } = await api<CalendarUrlResponse>(createPublicLink(calendarID, payload));
        const link = buildLink({
            urlID: CalendarUrlID,
            accessLevel,
            passphraseKey,
            cacheKey,
        });

        await call([calendarID]);
        createNotification({ type: 'success', text: c('Info').t`Link created` });
        setIsLoadingCreate(false);

        createModal(
            <ShareLinkSuccessModal
                onSubmit={(e: MouseEvent<HTMLButtonElement>) => {
                    textToClipboard(link, e.currentTarget);
                    notifyLinkCopied();
                }}
                accessLevel={accessLevel}
                link={link}
            />
        );
    };

    const toggleLinkLoading = (urlID: string, value: boolean) => {
        setIsLoadingMap((prevIsLoadingMap) => ({ ...prevIsLoadingMap, [urlID]: value }));
    };

    const tryLoadingAction = async (urlID: string, fn: () => Promise<void>) => {
        try {
            toggleLinkLoading(urlID, true);
            await fn();
        } catch (error) {
            createNotification({ type: 'error', text: error.message });
        } finally {
            toggleLinkLoading(urlID, false);
        }
    };

    const handleCopyLink = (link: string, e: MouseEvent<HTMLButtonElement>) => {
        textToClipboard(link, e.currentTarget);
        notifyLinkCopied();
    };

    const handleEdit = ({
        calendarID,
        urlID,
        purpose,
    }: {
        calendarID: string;
        urlID: string;
        purpose: Nullable<string>;
    }) => {
        return new Promise<void>((resolve, reject) => {
            createModal(
                <EditLinkModal
                    onSubmit={async (untrimmedPurpose) => {
                        return tryLoadingAction(urlID, async () => {
                            const { decryptedCalendarKeys } = await getCalendarInfo(calendarID);
                            const { publicKeys } = splitKeys(decryptedCalendarKeys);
                            const purpose = untrimmedPurpose.trim();
                            const encryptedPurpose = purpose
                                ? await generateEncryptedPurpose({ purpose, publicKeys })
                                : null;

                            await api<void>(editPublicLink({ calendarID, urlID, encryptedPurpose }));
                            await call([calendarID]);
                        });
                    }}
                    decryptedPurpose={purpose}
                    onClose={reject}
                />
            );
        });
    };
    const handleDelete = ({ calendarID, urlID }: { calendarID: string; urlID: string }) => {
        return new Promise((_resolve, reject) => {
            createModal(
                <DeleteLinkConfirmationModal
                    onConfirm={() => {
                        return tryLoadingAction(urlID, async () => {
                            await api<void>(deletePublicLink({ calendarID, urlID }));
                            await call([calendarID]);
                            createNotification({ type: 'success', text: c('Info').t`Link deleted` });
                        });
                    }}
                    onClose={reject}
                />
            );
        });
    };

    const infoParagraph = (
        <SettingsParagraph>{c('Info')
            .t`Create a link to your calendar and share it with anyone outside Proton. Only you can add or remove events.`}</SettingsParagraph>
    );

    return (
        <SettingsSection>
            {calendars.length ? (
                <>
                    {infoParagraph}
                    <ShareTable
                        linksMap={linksMap}
                        isLoadingCreate={isLoadingCreate}
                        disabled={!!isLoadingLinks}
                        calendars={calendars}
                        onCreateLink={handleCreateLink}
                        defaultCalendar={defaultCalendar}
                        user={user}
                    />
                </>
            ) : (
                <>
                    <Alert type="warning">{c('Info').t`You need to have a personal calendar to create a link.`}</Alert>
                    {infoParagraph}
                </>
            )}
            {isLoadingLinks ? (
                <div className="text-center">
                    <Loader />
                </div>
            ) : (
                <LinkTable
                    isLoadingMap={isLoadingMap}
                    linksMap={linksMap}
                    onCopyLink={handleCopyLink}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    user={user}
                />
            )}
        </SettingsSection>
    );
};

export default ShareSection;
