import type { Dispatch, SetStateAction } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike, Card } from '@proton/atoms';
import { useModalState } from '@proton/components/components';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import { SettingsParagraph, SettingsSectionWide } from '@proton/components/containers';
import { useApi, useNotifications } from '@proton/components/hooks';
import { removeInvitation, removeMember } from '@proton/shared/lib/api/calendars';
import { CALENDAR_SETTINGS_SECTION_ID, MAX_CALENDAR_MEMBERS } from '@proton/shared/lib/calendar/constants';
import { filterOutAcceptedInvitations } from '@proton/shared/lib/calendar/sharing/shareProton/shareProton';
import {
    APP_UPSELL_REF_PATH,
    BRAND_NAME,
    CALENDAR_UPSELL_PATHS,
    MAIL_SHORT_APP_NAME,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath, getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Address, Subscription, UserModel } from '@proton/shared/lib/interfaces';
import type { CalendarMember, CalendarMemberInvitation, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import SubSettingsSection from '../../layout/SubSettingsSection';
import ShareCalendarModal from '../shareProton/ShareCalendarModal';
import CalendarShareUrlSection from '../shareURL/CalendarShareUrlSection';
import CalendarMemberAndInvitationList from './CalendarMemberAndInvitationList';

import './CalendarMemberGrid.scss';

const MembersAndInvitationsLoadingSkeleton = () => (
    <>
        <div className="calendar-member-skeleton-container">
            <div className="calendar-member-skeleton calendar-member-skeleton--avatar rounded" />
            <div className="calendar-member-skeleton-user">
                <div className="calendar-member-skeleton calendar-member-skeleton--user-name" />
                <div className="calendar-member-skeleton calendar-member-skeleton--user-email" />
            </div>
        </div>
        <div className="calendar-member-skeleton-container">
            <div className="calendar-member-skeleton calendar-member-skeleton--avatar rounded" />
            <div className="calendar-member-skeleton-user">
                <div className="calendar-member-skeleton calendar-member-skeleton--user-name" />
                <div className="calendar-member-skeleton calendar-member-skeleton--user-email" />
            </div>
        </div>
    </>
);

interface CalendarShareSectionProps {
    calendar: VisualCalendar;
    addresses: Address[];
    user: UserModel;
    subscription?: Subscription;
    isLoading: boolean;
    canShare: boolean;
    invitations: CalendarMemberInvitation[];
    members: CalendarMember[];
    setMembers: Dispatch<SetStateAction<CalendarMember[]>>;
    setInvitations: Dispatch<SetStateAction<CalendarMemberInvitation[]>>;
}

const CalendarShareSection = ({
    calendar,
    addresses,
    user,
    subscription,
    isLoading,
    canShare,
    invitations,
    members,
    setInvitations,
    setMembers,
}: CalendarShareSectionProps) => {
    const api = useApi();
    const { createNotification } = useNotifications();

    const [shareCalendarModal, setIsShareModalOpen, renderShareCalendarModal] = useModalState();
    const { hasPaidMail } = user;

    const handleShare = () => {
        setIsShareModalOpen(true);
    };

    const handleDeleteMember = async (id: string) => {
        await api(removeMember(calendar.ID, id));
        setMembers((members) => members.filter(({ ID }) => ID !== id));
        createNotification({
            type: 'success',
            text: c('Notification in share calendar modal').t`Member deleted`,
        });
    };

    const handleDeleteInvitation = async (id: string, isDeclined: boolean) => {
        await api(removeInvitation(calendar.ID, id));
        setInvitations((prevState) => prevState.filter(({ CalendarInvitationID: ID }) => ID !== id));
        const text = isDeclined
            ? c('Notification in share calendar modal').t`Invitation deleted`
            : c('Notification in share calendar modal').t`Invitation revoked`;
        createNotification({ type: 'success', text });
    };

    const title = c('Calendar settings section title').t`Share calendar`;
    const pendingInvitations = filterOutAcceptedInvitations(invitations);
    const isMaximumMembersReached = members.length + pendingInvitations.length >= MAX_CALENDAR_MEMBERS;

    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.CALENDAR_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.BANNER,
        feature: CALENDAR_UPSELL_PATHS.SHARE_CAL,
        isSettings: true,
    });

    const sectionTitle = c('Calendar settings section title').t`Share with ${BRAND_NAME} users`;

    return (
        <SettingsSectionWide className="container-section-sticky-section">
            {renderShareCalendarModal && (
                <ShareCalendarModal
                    addresses={addresses}
                    members={members}
                    invitations={invitations}
                    calendar={calendar}
                    {...shareCalendarModal}
                    onFinish={(invitations) => setInvitations((prevState) => [...prevState, ...invitations])}
                />
            )}
            <SubSettingsSection title={title} id={CALENDAR_SETTINGS_SECTION_ID.SHARE}>
                {hasPaidMail && (
                    <>
                        <div className="mb-11 mt-6">
                            <div className="mb-6">
                                <h3 className="text-bold mb-2" id={CALENDAR_SETTINGS_SECTION_ID.SHARE_PRIVATELY}>
                                    {sectionTitle}
                                </h3>
                                <SettingsParagraph
                                    learnMoreUrl={getKnowledgeBaseUrl('/share-calendar-with-proton-users')}
                                >
                                    {c('Calendar settings private share description')
                                        .t`Share your calendar with other ${BRAND_NAME} users. Enable collaboration by allowing them to add and edit events in your calendar. You can modify the user permissions anytime.`}
                                </SettingsParagraph>
                                {!isMaximumMembersReached && (
                                    <Button
                                        onClick={handleShare}
                                        disabled={isLoading || !canShare || isMaximumMembersReached}
                                        color="norm"
                                        aria-label={sectionTitle}
                                    >
                                        {c('Action').t`Share`}
                                    </Button>
                                )}
                            </div>
                            {isLoading && <MembersAndInvitationsLoadingSkeleton />}
                            <CalendarMemberAndInvitationList
                                members={members}
                                invitations={invitations}
                                calendarID={calendar.ID}
                                canEdit={canShare}
                                onDeleteInvitation={handleDeleteInvitation}
                                onDeleteMember={handleDeleteMember}
                            />
                        </div>
                        <CalendarShareUrlSection calendar={calendar} user={user} canShare={canShare} />
                    </>
                )}
                {!hasPaidMail && (
                    <Card rounded className="mt-4" data-testid="card:upgrade">
                        <div className="flex flex-nowrap items-center">
                            <p className="flex-1 my-0 pr-7">
                                {c('Upgrade notice')
                                    .t`Upgrade to a ${MAIL_SHORT_APP_NAME} paid plan to share your calendar.`}
                            </p>
                            <ButtonLike
                                as={SettingsLink}
                                path={addUpsellPath(getUpgradePath({ user, subscription }), upsellRef)}
                                color="norm"
                                shape="solid"
                                size="small"
                            >
                                {c('Action').t`Upgrade`}
                            </ButtonLike>
                        </div>
                    </Card>
                )}
            </SubSettingsSection>
        </SettingsSectionWide>
    );
};

export default CalendarShareSection;
