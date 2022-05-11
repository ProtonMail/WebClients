import React, { useEffect, useLayoutEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router';

import { c } from 'ttag';

import {
    PrivateMainArea,
    SettingsPageTitle,
    SettingsParagraph,
    SettingsSection,
    SettingsSectionTitle,
} from '@proton/components/containers';
import CalendarSettingsBreadcrumbs from '@proton/components/containers/calendar/settings/CalendarSettingsBreadcrumbs';
import { useApi, useGetCalendarBootstrap, useNotifications } from '@proton/components/hooks';
import { getAllMembers, getCalendarInvitations } from '@proton/shared/lib/api/calendars';
import { getIsOwnedCalendar } from '@proton/shared/lib/calendar/calendar';
import { MEMBER_PERMISSIONS, getIsMember } from '@proton/shared/lib/calendar/permissions';
import { getIsSubscribedCalendar } from '@proton/shared/lib/calendar/subscribe/helpers';
import { Address, UserModel } from '@proton/shared/lib/interfaces';
import {
    CalendarMember,
    CalendarMemberInvitation,
    GetAllInvitationsApiResponse,
    GetAllMembersApiResponse,
    SubscribedCalendar,
    VisualCalendar,
} from '@proton/shared/lib/interfaces/calendar';

import { PrivateMainSettingsAreaBase } from '../../layout/PrivateMainSettingsArea';
import CalendarDeleteSection from './CalendarDeleteSection';
import CalendarEventDefaultsSection from './CalendarEventDefaultsSection';
import CalendarSettingsHeaderSection from './CalendarSettingsHeaderSection';
import CalendarShareSection from './CalendarShareSection';

interface Props {
    calendars: VisualCalendar[];
    subscribedCalendars: SubscribedCalendar[];
    defaultCalendar?: VisualCalendar;
    addresses: Address[];
    user: UserModel;
}

const SingleCalendarSettingsSection = ({ calendars, subscribedCalendars, defaultCalendar, addresses, user }: Props) => {
    const { calendarId } = useParams<{ calendarId: string }>();
    const history = useHistory();
    const getCalendarBootstrap = useGetCalendarBootstrap();
    const { createNotification } = useNotifications();
    const api = useApi();

    const [renderCount, setRenderCount] = useState(0);
    const [calendar, setCalendar] = useState<SubscribedCalendar | VisualCalendar>();
    const [bootstrap, setBootstrap] = useState();
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
            history.replace('/calendar/calendars');
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
                    //we leave the user stuck with a loader screen
                }
            };

            const loadMembersAndInvitations = async () => {
                if (!getIsOwnedCalendar(calendar)) {
                    return;
                }

                const [{ Members }, { Invitations }] = await Promise.all([
                    api<GetAllMembersApiResponse>(getAllMembers(calendar.ID)),
                    api<GetAllInvitationsApiResponse>(getCalendarInvitations(calendar.ID)),
                ]);
                // if failing here, leave user with loader in the section

                // filter out owner
                setMembers(Members.filter(({ Permissions }) => Permissions !== MEMBER_PERMISSIONS.OWNS));
                setInvitations(Invitations);
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
                    <SettingsPageTitle className="mt1-5 mb1-5 settings-loading-page-title" />
                    <section className="container-section-sticky-section">
                        <SettingsSectionTitle className="settings-loading-section-title" />
                        <SettingsSection>
                            <SettingsParagraph className="mb1">
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
    const isMember = getIsMember(calendar.Permissions);
    const isSubscribedCalendar = getIsSubscribedCalendar(calendar);

    const reRender = () => setRenderCount((count) => count + 1);

    return (
        <PrivateMainSettingsAreaBase
            title={calendar.Name}
            noTitle
            breadcrumbs={<CalendarSettingsBreadcrumbs calendar={calendar} calendars={calendars} />}
        >
            <div className="container-section-sticky-section container-section-sticky-section--single-calendar-section">
                <CalendarSettingsHeaderSection
                    calendar={calendar}
                    defaultCalendar={defaultCalendar}
                    onEdit={reRender}
                    isEditDisabled={!user.hasNonDelinquentScope || !isMember}
                />
                <CalendarEventDefaultsSection
                    isEditDisabled={!user.hasNonDelinquentScope}
                    calendar={calendar}
                    bootstrap={bootstrap}
                />
                {isOwner && !isSubscribedCalendar && (
                    <CalendarShareSection
                        calendar={calendar}
                        addresses={addresses}
                        isLoading={loadingShareData}
                        members={members}
                        invitations={invitations}
                        setInvitations={setInvitations}
                        setMembers={setMembers}
                        user={user}
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

export default SingleCalendarSettingsSection;
