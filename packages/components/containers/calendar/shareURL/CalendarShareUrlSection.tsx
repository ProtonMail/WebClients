import type { ComponentPropsWithoutRef, MouseEvent } from 'react';
import { useEffect, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import { SettingsParagraph } from '@proton/components/containers';
import { useLoading } from '@proton/hooks';
import useIsMounted from '@proton/hooks/useIsMounted';
import { deletePublicLink, editPublicLink, getPublicLinks } from '@proton/shared/lib/api/calendars';
import { CALENDAR_SETTINGS_SECTION_ID, MAX_LINKS_PER_CALENDAR } from '@proton/shared/lib/calendar/constants';
import { getPrimaryCalendarKey } from '@proton/shared/lib/calendar/crypto/keys/helpers';
import { generateEncryptedPurpose, transformLinksFromAPI } from '@proton/shared/lib/calendar/sharing/shareUrl/shareUrl';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { SimpleMap, UserModel } from '@proton/shared/lib/interfaces';
import type { ModalWithProps } from '@proton/shared/lib/interfaces/Modal';
import type { ACCESS_LEVEL, CalendarLink, CalendarUrl, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import type { Nullable } from '@proton/shared/lib/interfaces/utils';
import { splitKeys } from '@proton/shared/lib/keys';

import { Loader } from '../../../components';
import { useApi, useGetCalendarInfo, useNotifications } from '../../../hooks';
import { useModalsMap } from '../../../hooks/useModalsMap';
import DeleteLinkConfirmationModal from './DeleteLinkConfirmationModal';
import EditLinkModal from './EditLinkModal';
import LinkTable from './LinkTable';
import ShareLinkModal from './ShareLinkModal';
import ShareLinkSuccessModal from './ShareLinkSuccessModal';

const sortLinks = (links: CalendarLink[]) => [...links].sort((a, b) => a.CreateTime - b.CreateTime);

type ModalsMap = {
    shareLinkSuccessModal: ModalWithProps<{
        onSubmit: (e: MouseEvent<HTMLButtonElement>) => void;
        accessLevel: ACCESS_LEVEL;
        link: string;
    }>;
    deleteLinkConfirmationModal: ModalWithProps<{ calendarID: string; urlID: string }>;
    editLinkModal: ModalWithProps<{ calendarID: string; urlID: string; purpose: Nullable<string> }>;
    shareLinkModal: ModalWithProps<{ calendarID: string; onSubmit: () => void }>;
};

interface Props extends ComponentPropsWithoutRef<'div'> {
    calendar: VisualCalendar;
    user: UserModel;
    canShare: boolean;
    noTitle?: boolean;
}

const CalendarShareUrlSection = ({ calendar, user, canShare, noTitle }: Props) => {
    const [links, setLinks] = useState<CalendarLink[]>([]);
    const [isLoadingLinks, withLoadingLinks] = useLoading();
    const [isLoadingMap, setIsLoadingMap] = useState<Partial<SimpleMap<boolean>>>({});
    const api = useApi();
    const { createNotification } = useNotifications();
    const getCalendarInfo = useGetCalendarInfo();
    const isMounted = useIsMounted();

    const notifyLinkCopied = () => {
        createNotification({ type: 'info', text: c('Info').t`Link copied to clipboard` });
    };
    const handleError = ({ message }: Error) => createNotification({ type: 'error', text: message });

    const calendarID = calendar.ID;

    const { modalsMap, closeModal, updateModal } = useModalsMap<ModalsMap>({
        shareLinkSuccessModal: { isOpen: false },
        deleteLinkConfirmationModal: { isOpen: false },
        editLinkModal: { isOpen: false },
        shareLinkModal: { isOpen: false },
    });

    const handleCreateLink = async ({
        link,
        transformedLink,
        accessLevel,
    }: {
        link: string;
        transformedLink: CalendarLink[];
        accessLevel: ACCESS_LEVEL;
    }) => {
        setLinks((prevState) => [...prevState, ...transformedLink]);
        updateModal('shareLinkSuccessModal', {
            isOpen: true,
            props: {
                onSubmit: (e: MouseEvent<HTMLButtonElement>) => {
                    textToClipboard(link, e.currentTarget);
                    closeModal('shareLinkSuccessModal');
                    notifyLinkCopied();
                },
                accessLevel,
                link,
            },
        });
    };

    const toggleLinkLoading = (urlID: string, value: boolean) => {
        setIsLoadingMap((prevIsLoadingMap) => ({ ...prevIsLoadingMap, [urlID]: value }));
    };

    const tryLoadingAction = async (urlID: string, fn: () => Promise<void>) => {
        try {
            toggleLinkLoading(urlID, true);
            await fn();
        } catch (error: any) {
            createNotification({ type: 'error', text: error.message });
        } finally {
            toggleLinkLoading(urlID, false);
        }
    };

    const handleCopyLink = (link: string, e: MouseEvent<HTMLButtonElement>) => {
        textToClipboard(link, e.currentTarget);
        notifyLinkCopied();
    };

    const handleEdit = ({ urlID, purpose }: { urlID: string; purpose: Nullable<string> }) => {
        updateModal('editLinkModal', {
            isOpen: true,
            props: { calendarID: calendarID, urlID, purpose },
        });
    };

    const handleDelete = ({ calendarID, urlID }: { calendarID: string; urlID: string }) => {
        updateModal('deleteLinkConfirmationModal', {
            isOpen: true,
            props: { calendarID, urlID },
        });
    };

    const { editLinkModal, shareLinkSuccessModal, deleteLinkConfirmationModal, shareLinkModal } = modalsMap;
    const editLinkModalProps = editLinkModal.props;

    useEffect(() => {
        const getAllLinks = async () => {
            const { calendarKeys, passphrase } = await getCalendarInfo(calendarID);
            const { privateKeys } = splitKeys(calendarKeys);

            try {
                if (!isMounted()) {
                    return;
                }
                const { CalendarUrls } = await api<{ CalendarUrls: CalendarUrl[] }>(getPublicLinks(calendarID));
                const links = await transformLinksFromAPI({
                    calendarUrls: CalendarUrls,
                    privateKeys,
                    calendarPassphrase: passphrase,
                    onError: handleError,
                });
                const sortedLinks = sortLinks(links);

                if (!isMounted()) {
                    return;
                }
                setLinks(sortedLinks);
            } catch (e: any) {
                handleError(e);
            }
        };

        void withLoadingLinks(getAllLinks());
    }, [calendarID]);

    const maxLinksReached = links.length === MAX_LINKS_PER_CALENDAR;

    const content = (
        <>
            <SettingsParagraph learnMoreUrl={getKnowledgeBaseUrl('/share-calendar-via-link')}>
                {c('Calendar settings link share description')
                    .t`Create a link to your calendar and share it with anyone outside ${BRAND_NAME}. Only you can add or remove events.`}
            </SettingsParagraph>
            {!maxLinksReached && (
                <Button
                    onClick={() => updateModal('shareLinkModal', { isOpen: true })}
                    color="norm"
                    disabled={!canShare}
                    aria-label={c('Action').t`Create a link to share with anyone outside ${BRAND_NAME}`}
                >
                    {c('Action').t`Create link`}
                </Button>
            )}
        </>
    );

    return (
        <>
            <ShareLinkModal
                calendarID={calendarID}
                calendarName={calendar.Name}
                isOpen={shareLinkModal.isOpen}
                onSubmit={handleCreateLink}
                onClose={() => {
                    closeModal('shareLinkModal');
                }}
            />
            {!!editLinkModalProps && (
                <EditLinkModal
                    isOpen={editLinkModal.isOpen}
                    onSubmit={async (untrimmedPurpose) => {
                        const { calendarID, urlID } = editLinkModalProps;

                        return tryLoadingAction(urlID, async () => {
                            const { calendarKeys } = await getCalendarInfo(calendarID);
                            const { publicKey } = getPrimaryCalendarKey(calendarKeys);
                            const purpose = untrimmedPurpose.trim();
                            const encryptedPurpose = purpose
                                ? await generateEncryptedPurpose({ purpose, publicKey })
                                : null;

                            await api<void>(editPublicLink({ calendarID, urlID, encryptedPurpose }));
                            setLinks((prevState) =>
                                prevState.map((item) => {
                                    if (item.CalendarUrlID === urlID) {
                                        item.purpose = untrimmedPurpose;
                                        item.EncryptedPurpose = encryptedPurpose;
                                    }

                                    return item;
                                })
                            );

                            closeModal('editLinkModal');
                        });
                    }}
                    decryptedPurpose={editLinkModalProps.purpose}
                    onClose={() => {
                        closeModal('editLinkModal');
                    }}
                    subline={calendar.Name}
                />
            )}
            {!!shareLinkSuccessModal.props && (
                <ShareLinkSuccessModal
                    isOpen={shareLinkSuccessModal.isOpen}
                    onClose={() => closeModal('shareLinkSuccessModal')}
                    {...shareLinkSuccessModal.props}
                />
            )}
            {!!deleteLinkConfirmationModal.props && (
                <DeleteLinkConfirmationModal
                    isOpen={deleteLinkConfirmationModal.isOpen}
                    onConfirm={() => {
                        const { calendarID, urlID } = deleteLinkConfirmationModal.props!;

                        return tryLoadingAction(urlID, async () => {
                            await api<void>(deletePublicLink({ calendarID, urlID }));
                            setLinks((prevState) => prevState.filter((link) => link.CalendarUrlID !== urlID));
                            closeModal('deleteLinkConfirmationModal');
                            createNotification({ type: 'success', text: c('Info').t`Link deleted` });
                        });
                    }}
                    onClose={() => closeModal('deleteLinkConfirmationModal')}
                />
            )}

            <div className="mb-6">
                {noTitle ? (
                    content
                ) : (
                    <>
                        <h3 className="text-bold mb-2" id={CALENDAR_SETTINGS_SECTION_ID.SHARE_PUBLICLY}>
                            {c('Calendar settings section title').t`Share with anyone`}
                        </h3>
                        {content}
                    </>
                )}
            </div>
            {maxLinksReached && (
                <Alert className="mb-3" type="info">
                    {c('Maximum calendar links reached warning').ngettext(
                        msgid`You can create up to ${MAX_LINKS_PER_CALENDAR} link per calendar. To create a new link to this calendar, delete one from the list below.`,
                        `You can create up to ${MAX_LINKS_PER_CALENDAR} links per calendar. To create a new link to this calendar, delete one from the list below.`,
                        MAX_LINKS_PER_CALENDAR
                    )}
                </Alert>
            )}
            {isLoadingLinks ? (
                <div className="text-center">
                    <Loader />
                </div>
            ) : (
                <LinkTable
                    isLoadingMap={isLoadingMap}
                    links={links}
                    onCopyLink={handleCopyLink}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    user={user}
                />
            )}
        </>
    );
};

export default CalendarShareUrlSection;
