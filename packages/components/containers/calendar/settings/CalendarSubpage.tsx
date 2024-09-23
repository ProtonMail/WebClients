import { useEffect, useLayoutEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router';

import { c } from 'ttag';

import { PrivateMainArea } from '@proton/components';
import SettingsPageTitle from '@proton/components/containers/account/SettingsPageTitle';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import SettingsSectionTitle from '@proton/components/containers/account/SettingsSectionTitle';
import CalendarSettingsBreadcrumbs from '@proton/components/containers/calendar/settings/CalendarSettingsBreadcrumbs';
import { useApi, useGetCalendarBootstrap, useNotifications } from '@proton/components/hooks';
import { getAllMembers, getCalendarInvitations } from '@proton/shared/lib/api/calendars';
import { getIsOwnedCalendar, getIsPersonalCalendar } from '@proton/shared/lib/calendar/calendar';
import { MEMBER_PERMISSIONS } from '@proton/shared/lib/calendar/permissions';
import { getCalendarsSettingsPath } from '@proton/shared/lib/calendar/settingsRoutes';
import type { Address, Subscription, UserModel } from '@proton/shared/lib/interfaces';
import type {
    CalendarBootstrap,
    CalendarMember,
    CalendarMemberInvitation,
    GetAllMembersApiResponse,
    GetCalendarInvitationsResponse,
    SubscribedCalendar,
    VisualCalendar,
} from '@proton/shared/lib/interfaces/calendar';
import { MEMBER_INVITATION_STATUS } from '@proton/shared/lib/interfaces/calendar';

import { PrivateMainSettingsAreaBase } from '../../layout/PrivateMainSettingsArea';
import CalendarDeleteSection from './CalendarDeleteSection';
import CalendarEventDefaultsSection from './CalendarEventDefaultsSection';
import CalendarShareSection from './CalendarShareSection';
import CalendarSubpageHeaderSection from './CalendarSubpageHeaderSection';

interface Props {
    calendars: VisualCalendar[];
    subscribedCalendars: SubscribedCalendar[];
    holidaysCalendars: VisualCalendar[];
    defaultCalendar?: VisualCalendar;
    addresses?: Address[];
    user: UserModel;
    subscription?: Subscription;
}

const CalendarSubpage = ({
    calendars,
    subscribedCalendars,
    holidaysCalendars,
    defaultCalendar,
    addresses,
    user,
    subscription,
}: Props) => {
    const { calendarId } = useParams<{ calendarId: string }>();
    const history = useHistory();
    const getCalendarBootstrap = useGetCalendarBootstrap();
    const { createNotification } = useNotifications();
    const api = useApi();

    const [renderCount, setRenderCount] = useState(0);
    const [calendar, setCalendar] = useState<SubscribedCalendar | VisualCalendar>();
    const [bootstrap, setBootstrap] = useState<CalendarBootstrap>();
    const [invitations, setInvitations] = useState<CalendarMemberInvitation[]>([]);
    const [members, setMembers] = useState<CalendarMember[]>([]);
    const [loadingShareData, setLoadingShareData] = useState(true);

    useLayoutEffect(() => {
        const calendar =
            subscribedCalendars.find(({ ID }) => ID === calendarId) || calendars.find(({ ID }) => ID === calendarId);

        if (!calendar) {
            createNotification({
                type: 'error',
                text: c('Error').t`Calendar cannot be found`,
            });
            history.replace(getCalendarsSettingsPath({ fullPath: true }));
        } else {
            setCalendar(calendar);
        }
    }, [calendarId, renderCount]);

    useEffect(
        () => {
            if (!calendar) {
                return;
            } else {
                setBootstrap(undefined);
            }

            const loadBootstrap = async () => {
                try {
                    setBootstrap(await getCalendarBootstrap(calendar.ID));
                } catch (e: any) {
                    const text = e?.message || 'Failed to retrieve calendar details';
                    createNotification({
                        type: 'error',
                        text,
                    });
                    // we leave the user stuck with a loader screen
                }
            };

            const loadMembersAndInvitations = async () => {
                // set loading state to true in case the component did not get unmounted
                setLoadingShareData(true);
                if (!getIsOwnedCalendar(calendar)) {
                    return;
                }

                const [{ Members }, { Invitations }] = await Promise.all([
                    api<GetAllMembersApiResponse>(getAllMembers(calendar.ID)),
                    api<GetCalendarInvitationsResponse>(getCalendarInvitations(calendar.ID)),
                ]);
                // if failing here, leave user with loader in the section

                // filter out owner and accepted invitations
                setMembers(Members.filter(({ Permissions }) => Permissions !== MEMBER_PERMISSIONS.OWNS));
                setInvitations(Invitations.filter(({ Status }) => Status !== MEMBER_INVITATION_STATUS.ACCEPTED));
                setLoadingShareData(false);
            };

            Promise.all([loadBootstrap(), loadMembersAndInvitations()]);
        },
        // re-load bootstrap only if calendar changes. Do not listen to dynamic changes
        [calendar]
    );

    if (!calendar) {
        return null;
    }

    if (!bootstrap) {
        return (
            <PrivateMainArea>
                <div className="container-section-sticky">
                    <SettingsPageTitle className="my-14 settings-loading-page-title" />
                    <section className="container-section-sticky-section">
                        <SettingsSectionTitle className="settings-loading-section-title" />
                        <SettingsSection>
                            <SettingsParagraph className="mb-4">
                                <span className="block settings-loading-paragraph-line" />
                                <span className="block settings-loading-paragraph-line" />
                                <span className="block settings-loading-paragraph-line" />
                            </SettingsParagraph>
                        </SettingsSection>
                    </section>
                </div>
            </PrivateMainArea>
        );
    }

    const hasMembersOrInvitations = !!(members.length || invitations.length);
    const isOwner = getIsOwnedCalendar(calendar);
    const isPersonalCalendar = getIsPersonalCalendar(calendar);

    const reRender = () => setRenderCount((count) => count + 1);

    return (
        <PrivateMainSettingsAreaBase
            title={calendar.Name}
            noTitle
            breadcrumbs={<CalendarSettingsBreadcrumbs calendar={calendar} calendars={calendars} />}
        >
            <div className="container-section-sticky-section container-section-sticky-section--single-calendar-section">
                <CalendarSubpageHeaderSection
                    calendar={calendar}
                    holidaysCalendars={holidaysCalendars}
                    defaultCalendar={defaultCalendar}
                    onEdit={reRender}
                    canEdit={user.hasNonDelinquentScope}
                />
                <CalendarEventDefaultsSection
                    calendar={calendar}
                    bootstrap={bootstrap}
                    canEdit={user.hasNonDelinquentScope}
                />
                {isOwner && isPersonalCalendar && addresses && (
                    <CalendarShareSection
                        calendar={calendar}
                        addresses={addresses}
                        user={user}
                        subscription={subscription}
                        isLoading={loadingShareData}
                        canShare={user.hasNonDelinquentScope}
                        members={members}
                        invitations={invitations}
                        setInvitations={setInvitations}
                        setMembers={setMembers}
                    />
                )}
                <CalendarDeleteSection
                    calendars={calendars}
                    calendar={calendar}
                    defaultCalendar={defaultCalendar}
                    isShared={hasMembersOrInvitations}
                />
            </div>
        </PrivateMainSettingsAreaBase>
    );
};

export default CalendarSubpage;
