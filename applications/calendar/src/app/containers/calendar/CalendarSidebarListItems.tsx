import type { MouseEvent } from 'react';
import { useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import {
    HolidaysCalendarModal,
    ImportModal,
    PersonalCalendarModal,
    Prompt,
    useApi,
    useModalState,
    useNotifications,
    useSettingsLink,
} from '@proton/components';
import { CALENDAR_MODAL_TYPE } from '@proton/components/containers/calendar/calendarModal/interface';
import ShareCalendarModal from '@proton/components/containers/calendar/shareProton/ShareCalendarModal';
import ShareLinkModal from '@proton/components/containers/calendar/shareURL/ShareLinkModal';
import ShareLinkSuccessModal from '@proton/components/containers/calendar/shareURL/ShareLinkSuccessModal';
import { useModalsMap } from '@proton/components/hooks/useModalsMap';
import { useLoading } from '@proton/hooks';
import type { LoadingByKey } from '@proton/hooks/useLoading';
import { getAllMembers, getCalendarInvitations, getPublicLinks } from '@proton/shared/lib/api/calendars';
import { getIsHolidaysCalendar, getIsOwnedCalendar } from '@proton/shared/lib/calendar/calendar';
import {
    CALENDAR_SETTINGS_SECTION_ID,
    MAX_CALENDAR_MEMBERS,
    MAX_LINKS_PER_CALENDAR,
} from '@proton/shared/lib/calendar/constants';
import { MEMBER_PERMISSIONS } from '@proton/shared/lib/calendar/permissions';
import { getCalendarSubpagePath } from '@proton/shared/lib/calendar/settingsRoutes';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import type { Address, Nullable } from '@proton/shared/lib/interfaces';
import type { ModalWithProps } from '@proton/shared/lib/interfaces/Modal';
import type {
    ACCESS_LEVEL,
    CalendarMember,
    CalendarMemberInvitation,
    CalendarUrlsResponse,
    GetAllMembersApiResponse,
    GetCalendarInvitationsResponse,
    SubscribedCalendar,
    VisualCalendar,
} from '@proton/shared/lib/interfaces/calendar';
import { MEMBER_INVITATION_STATUS } from '@proton/shared/lib/interfaces/calendar';
import noop from '@proton/utils/noop';

import CalendarSidebarListItem from './CalendarSidebarListItem';
import CalendarSidebarShareCalendarModal from './CalendarSidebarShareCalendarModal';

type ModalsMap = {
    shareLinkSuccessModal: ModalWithProps<{
        onSubmit: (e: MouseEvent<HTMLButtonElement>) => void;
        accessLevel: ACCESS_LEVEL;
        link: string;
    }>;
    shareLinkModal: ModalWithProps<{
        calendarID: string;
        calendarName: string;
        onSubmit: ({ link, accessLevel }: { link: string; accessLevel: ACCESS_LEVEL }) => Promise<void>;
    }>;
    limitModal: ModalWithProps<{
        title: string;
        body: string;
        onClick: () => void;
        buttonText: string;
    }>;
};

export interface CalendarSidebarListItemsProps {
    calendars: VisualCalendar[] | SubscribedCalendar[];
    allCalendars: VisualCalendar[];
    loadingVisibility?: LoadingByKey;
    loadingSubscriptionParameters?: boolean;
    onChangeVisibility: (id: string, checked: boolean) => void;
    addresses: Address[];
}

const CalendarSidebarListItems = ({
    calendars,
    allCalendars,
    loadingVisibility = {},
    loadingSubscriptionParameters = false,
    onChangeVisibility = noop,
    addresses,
}: CalendarSidebarListItemsProps) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const goToSettings = useSettingsLink();

    const [loadingFetchMemberAndInvitations, withLoadingFetchMemberAndInvitations] = useLoading();
    const [loadingLinks, withLoadingLinks] = useLoading();

    const [importModalCalendar, setImportModalCalendar] = useState<Nullable<VisualCalendar>>(null);
    const [calendarModalCalendar, setCalendarModalCalendar] = useState<Nullable<VisualCalendar>>(null);
    const [calendarModalType, setCalendarModalType] = useState(CALENDAR_MODAL_TYPE.COMPLETE);
    const [isSharePrivatelyModalOpen, setIsSharePrivatelyModalOpen] = useState(false);

    const [shareModalCalendar, setShareModalCalendar] = useState<Nullable<VisualCalendar>>(null);
    const [{ open: isShareModalOpen, ...shareModalProps }, setIsShareModalOpen] = useModalState();
    const [invitations, setInvitations] = useState<CalendarMemberInvitation[]>([]);
    const [members, setMembers] = useState<CalendarMember[]>([]);

    const [{ onExit: onExitCalendarModal, ...calendarModalProps }, setIsCalendarModalOpen] = useModalState();
    const [
        {
            open: isHolidaysModalOpen,
            onClose: onCloseHolidaysModal,
            onExit: onExitHolidaysModal,
            ...holidaysModalProps
        },
        setIsHolidaysCalendarModalOpen,
        renderHolidaysCalendarModal,
    ] = useModalState();
    const [
        { open: isImportModalOpen, onClose: onCloseImportModal, onExit: onExitImportModal, ...importModalProps },
        setIsImportModalOpen,
    ] = useModalState();

    const holidaysCalendars = allCalendars.filter((calendar) => getIsHolidaysCalendar(calendar));

    const { modalsMap, closeModal, updateModal } = useModalsMap<ModalsMap>({
        shareLinkSuccessModal: { isOpen: false },
        shareLinkModal: { isOpen: false },
        limitModal: { isOpen: false },
    });

    const handleOpenEditModal = (calendar: VisualCalendar | SubscribedCalendar) => {
        const isOwnedCalendar = getIsOwnedCalendar(calendar);
        const isHolidaysCalendar = getIsHolidaysCalendar(calendar);

        setCalendarModalCalendar(calendar);

        if (isHolidaysCalendar) {
            setIsHolidaysCalendarModalOpen(true);
        } else {
            setCalendarModalType(isOwnedCalendar ? CALENDAR_MODAL_TYPE.COMPLETE : CALENDAR_MODAL_TYPE.SHARED);
            setIsCalendarModalOpen(true);
        }
    };

    if (calendars.length === 0) {
        return null;
    }

    const notifyLinkCopied = () => {
        createNotification({ type: 'info', text: c('Info').t`Link copied to clipboard` });
    };
    const handleCreateLink = async ({ link, accessLevel }: { link: string; accessLevel: ACCESS_LEVEL }) => {
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

    const fetchMembersAndInvitations = async (calendarID: string) => {
        const [{ Members }, { Invitations }] = await Promise.all([
            api<GetAllMembersApiResponse>(getAllMembers(calendarID)),
            api<GetCalendarInvitationsResponse>(getCalendarInvitations(calendarID)),
        ]);

        // filter out owner and accepted invitations
        const filteredMembers = Members.filter(({ Permissions }) => Permissions !== MEMBER_PERMISSIONS.OWNS);
        const filteredInvitations = Invitations.filter(({ Status }) => Status !== MEMBER_INVITATION_STATUS.ACCEPTED);
        setMembers(filteredMembers);
        setInvitations(filteredInvitations);

        return filteredMembers.length + filteredInvitations.length >= MAX_CALENDAR_MEMBERS;
    };

    const fetchLinks = async (calendarID: string) => {
        const { CalendarUrls } = await api<CalendarUrlsResponse>(getPublicLinks(calendarID));

        return CalendarUrls.length >= MAX_LINKS_PER_CALENDAR;
    };

    const { shareLinkSuccessModal, shareLinkModal, limitModal } = modalsMap;

    const getLimitCalendarProps = ({
        calendarID,
        isShareByLink = false,
    }: {
        calendarID: string;
        isShareByLink?: boolean;
    }) => {
        if (isShareByLink) {
            return {
                title: c('Calendar share limit modal').t`Unable to create more calendar links`,
                body: c('Calendar share limit modal').ngettext(
                    msgid`You have reached the maximum of ${MAX_LINKS_PER_CALENDAR} link for this calendar.
To create a new link to this calendar, delete an existing one.`,
                    `You have reached the maximum of ${MAX_LINKS_PER_CALENDAR} links for this calendar.
To create a new link to this calendar, delete an existing one.`,
                    MAX_LINKS_PER_CALENDAR
                ),
                onClick: () =>
                    goToSettings(
                        getCalendarSubpagePath(calendarID, {
                            sectionId: CALENDAR_SETTINGS_SECTION_ID.SHARE_PUBLICLY,
                        }),
                        APPS.PROTONCALENDAR
                    ),
                buttonText: c('Calendar share limit modal').t`Manage links`,
            };
        }

        return {
            title: c('Calendar share limit modal').t`Unable to share this calendar with more ${BRAND_NAME} users`,
            body: c('Calendar share limit modal').ngettext(
                msgid`You have reached the maximum of ${MAX_CALENDAR_MEMBERS} member for this calendar.
To share this calendar with more ${BRAND_NAME} accounts, remove some members.`,
                `You have reached the maximum of ${MAX_CALENDAR_MEMBERS} members for this calendar.
To share this calendar with more ${BRAND_NAME} accounts, remove some members.`,
                MAX_CALENDAR_MEMBERS
            ),
            onClick: () =>
                goToSettings(
                    getCalendarSubpagePath(calendarID, {
                        sectionId: CALENDAR_SETTINGS_SECTION_ID.SHARE_PRIVATELY,
                    }),
                    APPS.PROTONCALENDAR
                ),
            buttonText: c('Calendar share limit modal').t`Manage members`,
        };
    };

    return (
        <>
            {calendars.map((calendar) => {
                return (
                    <CalendarSidebarListItem
                        key={calendar.ID}
                        calendar={calendar}
                        onChangeVisibility={onChangeVisibility}
                        loadingVisibility={loadingVisibility[calendar.ID]}
                        loadingSubscriptionParameters={loadingSubscriptionParameters}
                        onOpenEditCalendarModal={(calendar) => {
                            handleOpenEditModal(calendar);
                        }}
                        onOpenImportCalendarModal={(calendar) => {
                            setImportModalCalendar(calendar);
                            setIsImportModalOpen(true);
                        }}
                        onOpenShareCalendarModal={(calendar) => {
                            setShareModalCalendar(calendar);
                            setIsShareModalOpen(true);
                        }}
                    />
                );
            })}

            {limitModal.props && (
                <Prompt
                    open={limitModal.isOpen}
                    title={limitModal.props.title}
                    buttons={[
                        <Button color="norm" onClick={limitModal.props.onClick}>
                            {limitModal.props.buttonText}
                        </Button>,
                        <Button onClick={() => updateModal('limitModal', { isOpen: false, props: undefined })}>{c(
                            'Action'
                        ).t`Got it`}</Button>,
                    ]}
                >
                    {limitModal.props.body.split('\n').map((p) => (
                        <p>{p}</p>
                    ))}
                </Prompt>
            )}
            {shareModalCalendar && (
                <ShareCalendarModal
                    calendar={shareModalCalendar}
                    addresses={addresses}
                    members={members}
                    invitations={invitations}
                    open={isSharePrivatelyModalOpen}
                    onClose={() => setIsSharePrivatelyModalOpen(false)}
                />
            )}
            {shareLinkSuccessModal.props && (
                <ShareLinkSuccessModal
                    isOpen={shareLinkSuccessModal.isOpen}
                    onClose={() => closeModal('shareLinkSuccessModal')}
                    {...shareLinkSuccessModal.props}
                />
            )}
            {shareLinkModal.props && (
                <ShareLinkModal
                    onClose={() => closeModal('shareLinkModal')}
                    isOpen={shareLinkModal.isOpen}
                    {...shareLinkModal.props}
                />
            )}
            {shareModalCalendar && (
                <CalendarSidebarShareCalendarModal
                    {...shareModalProps}
                    calendarName={shareModalCalendar.Name}
                    onSharePrivately={async () =>
                        withLoadingFetchMemberAndInvitations(
                            fetchMembersAndInvitations(shareModalCalendar.ID).then((isMaximumMembersReached) => {
                                setIsShareModalOpen(false);

                                if (isMaximumMembersReached) {
                                    updateModal('limitModal', {
                                        isOpen: true,
                                        props: getLimitCalendarProps({ calendarID: shareModalCalendar.ID }),
                                    });
                                } else {
                                    setIsSharePrivatelyModalOpen(true);
                                }
                            })
                        )
                    }
                    onSharePublicly={() => {
                        void withLoadingLinks(
                            fetchLinks(shareModalCalendar.ID)
                                .then((isMaximumLinksReached) => {
                                    setIsShareModalOpen(false);

                                    if (isMaximumLinksReached) {
                                        updateModal('limitModal', {
                                            isOpen: true,
                                            props: getLimitCalendarProps({
                                                calendarID: shareModalCalendar.ID,
                                                isShareByLink: true,
                                            }),
                                        });
                                    } else {
                                        updateModal('shareLinkModal', {
                                            isOpen: true,
                                            props: {
                                                calendarID: shareModalCalendar.ID,
                                                calendarName: shareModalCalendar.Name,
                                                onSubmit: handleCreateLink,
                                            },
                                        });
                                    }
                                })
                                .catch(noop)
                        );
                    }}
                    isOpen={isShareModalOpen}
                    loadingFetchMembersAndInvitations={loadingFetchMemberAndInvitations}
                    loadingLinks={loadingLinks}
                />
            )}
            {calendarModalCalendar && (
                <PersonalCalendarModal
                    {...calendarModalProps}
                    onExit={() => {
                        setCalendarModalCalendar(null);
                        onExitCalendarModal?.();
                    }}
                    calendar={calendarModalCalendar}
                    type={calendarModalType}
                />
            )}
            {calendarModalCalendar && renderHolidaysCalendarModal && (
                <HolidaysCalendarModal
                    {...holidaysModalProps}
                    open={isHolidaysModalOpen}
                    onClose={onCloseHolidaysModal}
                    onExit={() => {
                        setCalendarModalCalendar(null);
                        onExitHolidaysModal?.();
                    }}
                    calendar={calendarModalCalendar}
                    holidaysCalendars={holidaysCalendars}
                />
            )}
            {importModalCalendar && (
                <ImportModal
                    {...importModalProps}
                    isOpen={isImportModalOpen}
                    onClose={onCloseImportModal}
                    onExit={() => {
                        onExitImportModal?.();
                        setImportModalCalendar(null);
                    }}
                    initialCalendar={importModalCalendar}
                    calendars={allCalendars}
                />
            )}
        </>
    );
};

export default CalendarSidebarListItems;
