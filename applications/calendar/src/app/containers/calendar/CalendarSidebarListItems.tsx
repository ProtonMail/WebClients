import { MouseEvent, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import {
    AlertModal,
    Checkbox,
    DropdownMenuLink,
    FeatureCode,
    Icon,
    SettingsLink,
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemLabel,
    SimpleDropdown,
    Tooltip,
    classnames,
    useApi,
    useFeature,
    useLoading,
    useModalState,
    useNotifications,
    useSettingsLink,
    useUser,
} from '@proton/components';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { CALENDAR_MODAL_TYPE, CalendarModal } from '@proton/components/containers/calendar/calendarModal/CalendarModal';
import { ImportModal } from '@proton/components/containers/calendar/importModal';
import ShareCalendarModal from '@proton/components/containers/calendar/shareModal/ShareCalendarModal';
import ShareLinkModal from '@proton/components/containers/calendar/shareURL/ShareLinkModal';
import ShareLinkSuccessModal from '@proton/components/containers/calendar/shareURL/ShareLinkSuccessModal';
import { useModalsMap } from '@proton/components/hooks/useModalsMap';
import { getAllMembers, getCalendarInvitations, getPublicLinks } from '@proton/shared/lib/api/calendars';
import { getIsCalendarDisabled, getIsOwnedCalendar, getIsPersonalCalendar } from '@proton/shared/lib/calendar/calendar';
import {
    CALENDAR_SETTINGS_SECTION_ID,
    COLORS,
    MAX_CALENDAR_MEMBERS,
    MAX_LINKS_PER_CALENDAR,
} from '@proton/shared/lib/calendar/constants';
import { MEMBER_PERMISSIONS } from '@proton/shared/lib/calendar/permissions';
import { getCalendarSubpagePath } from '@proton/shared/lib/calendar/settingsRoutes';
import {
    getCalendarHasSubscriptionParameters,
    getCalendarIsNotSyncedInfo,
} from '@proton/shared/lib/calendar/subscribe/helpers';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { Address, Nullable } from '@proton/shared/lib/interfaces';
import { ModalWithProps } from '@proton/shared/lib/interfaces/Modal';
import {
    ACCESS_LEVEL,
    CalendarMember,
    CalendarMemberInvitation,
    CalendarUrlsResponse,
    GetAllMembersApiResponse,
    GetCalendarInvitationsResponse,
    MEMBER_INVITATION_STATUS,
    SubscribedCalendar,
    VisualCalendar,
} from '@proton/shared/lib/interfaces/calendar';
import noop from '@proton/utils/noop';

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
    calendars?: VisualCalendar[] | SubscribedCalendar[];
    loading?: boolean;
    onChangeVisibility: (id: string, checked: boolean) => void;
    actionsDisabled?: boolean;
    addresses: Address[];
}

const CalendarSidebarListItems = ({
    calendars = [],
    loading = false,
    onChangeVisibility = noop,
    actionsDisabled = false,
    addresses,
}: CalendarSidebarListItemsProps) => {
    const [user] = useUser();
    const api = useApi();
    const { createNotification } = useNotifications();
    const goToSettings = useSettingsLink();

    const isCalendarSharingEnabled = !!useFeature(FeatureCode.CalendarSharingEnabled).feature?.Value;

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
        { open: isImportModalOpen, onClose: onCloseImportModal, onExit: onExitImportModal, ...importModalProps },
        setIsImportModalOpen,
    ] = useModalState();

    const { modalsMap, closeModal, updateModal } = useModalsMap<ModalsMap>({
        shareLinkSuccessModal: { isOpen: false },
        shareLinkModal: { isOpen: false },
        limitModal: { isOpen: false },
    });

    if (calendars.length === 0) {
        return null;
    }

    const result = calendars.map((calendar) => {
        const { ID, Name, Display, Color } = calendar;
        const isPersonalCalendar = getIsPersonalCalendar(calendar);
        const isCalendarDisabled = getIsCalendarDisabled(calendar);
        const isOwnedCalendar = getIsOwnedCalendar(calendar);

        const left = (
            <Checkbox
                className="mr0-75 flex-item-noshrink"
                color={COLORS.WHITE}
                backgroundColor={Display ? Color : 'transparent'}
                borderColor={Color}
                checked={!!Display}
                disabled={loading}
                id={`calendar-${ID}`}
                name={`calendar-${Name}`}
                aria-describedby={`calendar-${Name}`}
                onChange={({ target: { checked } }) => onChangeVisibility(ID, checked)}
            />
        );

        const isNotSyncedInfo = getCalendarHasSubscriptionParameters(calendar)
            ? getCalendarIsNotSyncedInfo(calendar)
            : undefined;

        return (
            <SidebarListItem key={ID}>
                <SidebarListItemLabel
                    htmlFor={`calendar-${ID}`}
                    className="calendar-sidebar-list-item opacity-on-hover-container py0-25 pr0-5"
                >
                    <SidebarListItemContent
                        data-test-id="calendar-sidebar:user-calendars"
                        left={left}
                        className={classnames(['flex', (isCalendarDisabled || isNotSyncedInfo) && 'color-weak'])}
                    >
                        <div className="flex flex-nowrap flex-justify-space-between flex-align-items-center w100">
                            <div className="flex flex-nowrap mr0-5">
                                <div className="text-ellipsis" title={Name}>
                                    {Name}
                                </div>
                                {!isCalendarDisabled && isNotSyncedInfo && (
                                    <div className="flex-item-noshrink max-w100 text-ellipsis">
                                        &nbsp;
                                        <Tooltip title={isNotSyncedInfo.text}>
                                            <span>({isNotSyncedInfo.label})</span>
                                        </Tooltip>
                                    </div>
                                )}
                                {isCalendarDisabled && (
                                    <div className="flex-item-noshrink">
                                        &nbsp;({c('Disabled calendar name suffix').t`Disabled`})
                                    </div>
                                )}
                                {!isOwnedCalendar && (
                                    <Tooltip title={c('Calendar sidebar; Calendar info').t`Shared with me`}>
                                        <div className="flex-item-noshrink ml0-25">
                                            <Icon name="users" />
                                        </div>
                                    </Tooltip>
                                )}
                            </div>

                            <Tooltip title={c('Sidebar calendar edit tooltip').t`Manage calendar`}>
                                <SimpleDropdown
                                    as={Button}
                                    icon
                                    hasCaret={false}
                                    shape="ghost"
                                    size="small"
                                    className="calendar-sidebar-list-item-action opacity-on-hover flex-item-noshrink no-mobile"
                                    loading={actionsDisabled}
                                    content={<Icon name="three-dots-horizontal" />}
                                >
                                    <DropdownMenu>
                                        <DropdownMenuButton
                                            className="text-left"
                                            onClick={() => {
                                                setCalendarModalCalendar(calendar);
                                                setCalendarModalType(
                                                    isOwnedCalendar
                                                        ? CALENDAR_MODAL_TYPE.COMPLETE
                                                        : CALENDAR_MODAL_TYPE.SHARED
                                                );
                                                setIsCalendarModalOpen(true);
                                            }}
                                        >
                                            {c('Action').t`Edit`}
                                        </DropdownMenuButton>
                                        {isPersonalCalendar &&
                                            isOwnedCalendar &&
                                            user.hasPaidMail &&
                                            (isCalendarSharingEnabled ? (
                                                <DropdownMenuButton
                                                    className="text-left"
                                                    onClick={() => {
                                                        setShareModalCalendar(calendar);
                                                        setIsShareModalOpen(true);
                                                    }}
                                                >
                                                    {c('Action').t`Share`}
                                                </DropdownMenuButton>
                                            ) : (
                                                <DropdownMenuLink
                                                    as={SettingsLink}
                                                    path={getCalendarSubpagePath(calendar.ID, {
                                                        sectionId: CALENDAR_SETTINGS_SECTION_ID.SHARE,
                                                    })}
                                                >
                                                    {c('Action').t`Share`}
                                                </DropdownMenuLink>
                                            ))}
                                        {isPersonalCalendar && isOwnedCalendar && !isCalendarDisabled && (
                                            <DropdownMenuButton
                                                className="text-left"
                                                onClick={() => {
                                                    if (user.hasNonDelinquentScope) {
                                                        setImportModalCalendar(calendar);
                                                        setIsImportModalOpen(true);
                                                    }
                                                }}
                                            >
                                                {c('Action').t`Import events`}
                                            </DropdownMenuButton>
                                        )}
                                        <hr className="mt0-5 mb0-5" />
                                        <DropdownMenuLink
                                            as={SettingsLink}
                                            app={APPS.PROTONCALENDAR}
                                            path={getCalendarSubpagePath(calendar.ID)}
                                        >
                                            {c('Calendar sidebar dropdown item').t`More options`}
                                        </DropdownMenuLink>
                                    </DropdownMenu>
                                </SimpleDropdown>
                            </Tooltip>
                        </div>
                    </SidebarListItemContent>
                </SidebarListItemLabel>
            </SidebarListItem>
        );
    });
    const notifyLinkCopied = () => {
        createNotification({ type: 'info', text: c('Info').t`Link copied to clipboard` });
    };
    const handleCreateLink = async ({ link, accessLevel }: { link: string; accessLevel: ACCESS_LEVEL }) => {
        updateModal('shareLinkSuccessModal', {
            isOpen: true,
            props: {
                onSubmit: (e: MouseEvent<HTMLButtonElement>) => {
                    textToClipboard(link, e.currentTarget);
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
            {!!limitModal.props && (
                <AlertModal
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
                </AlertModal>
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
            {!!shareLinkSuccessModal.props && (
                <ShareLinkSuccessModal
                    isOpen={shareLinkSuccessModal.isOpen}
                    onClose={() => closeModal('shareLinkSuccessModal')}
                    {...shareLinkSuccessModal.props}
                />
            )}
            {!!shareLinkModal.props && (
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
            {!!calendarModalCalendar && (
                <CalendarModal
                    {...calendarModalProps}
                    onExit={() => {
                        setCalendarModalCalendar(null);
                        onExitCalendarModal?.();
                    }}
                    calendar={calendarModalCalendar}
                    type={calendarModalType}
                />
            )}
            {!!importModalCalendar && (
                <ImportModal
                    {...importModalProps}
                    isOpen={isImportModalOpen}
                    onClose={onCloseImportModal}
                    onExit={() => {
                        onExitImportModal?.();
                        setImportModalCalendar(null);
                    }}
                    defaultCalendar={importModalCalendar}
                    calendars={calendars}
                />
            )}
            {result}
        </>
    );
};

export default CalendarSidebarListItems;
