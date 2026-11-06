import type { ReactNode } from 'react';

import { c } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { calendarSettingsActions } from '@proton/calendar/calendarUserSettings';
import { useCalendarUserSettings } from '@proton/calendar/calendarUserSettings/hooks';
import Toggle from '@proton/components/components/toggle/Toggle';
import InviteLocaleSelector from '@proton/components/containers/calendar/settings/InviteLocaleSelector';
import PrimaryTimezoneSelector from '@proton/components/containers/calendar/settings/PrimaryTimezoneSelector';
import SecondaryTimezoneSelector from '@proton/components/containers/calendar/settings/SecondaryTimezoneSelector';
import ShowSecondaryTimezoneToggle from '@proton/components/containers/calendar/settings/ShowSecondaryTimezoneToggle';
import ViewPreferenceSelector from '@proton/components/containers/calendar/settings/ViewPreferenceSelector';
import WeekStartSelector from '@proton/components/containers/calendar/settings/WeekStartSelector';
import {
    getIsAutoAddMeetLinkEnabled,
    getToggledAutoAddMeetLink,
} from '@proton/components/containers/calendar/settings/autoAddMeetLink';
import { useIsMeetVideoConferenceEnabled } from '@proton/components/containers/calendar/settings/useIsMeetVideoConferenceEnabled';
import useLoading from '@proton/hooks/useLoading';
import { updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import { getClosestLocaleCode } from '@proton/shared/lib/i18n/helper';
import { locales } from '@proton/shared/lib/i18n/locales';
import type { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar/Calendar';

import { useAccountDispatch } from '../../../private-app/store/hooks';
import MobileSection from '../../components/MobileSection';
import MobileSectionLabel from '../../components/MobileSectionLabel';
import MobileSectionRow from '../../components/MobileSectionRow';

import '../MobileSettings.scss';

interface Props {
    layout: (children: ReactNode, props?: any) => ReactNode;
    loader: ReactNode;
}

const CalendarSettings = ({ layout, loader }: Props) => {
    const api = useApi();
    const dispatch = useAccountDispatch();
    const { createNotification } = useNotifications();

    // Read by WeekStartSelector, and not preloaded by the lite app
    const [userSettings, loadingUserSettings] = useUserSettings();
    const [calendarUserSettings, loadingCalendarUserSettings] = useCalendarUserSettings();

    const isMeetVideoConferenceEnabled = useIsMeetVideoConferenceEnabled();

    const [loadingAutoDetect, withLoadingAutoDetect] = useLoading();
    const [loadingView, withLoadingView] = useLoading();
    const [loadingWeekNumbers, withLoadingWeekNumbers] = useLoading();
    const [loadingInviteLocale, withLoadingInviteLocale] = useLoading();
    const [loadingAutoImportInvite, withLoadingAutoImportInvite] = useLoading();
    const [loadingAutoAddMeetLink, withLoadingAutoAddMeetLink] = useLoading();

    if (loadingCalendarUserSettings || !calendarUserSettings || loadingUserSettings || !userSettings) {
        return loader;
    }

    const handleChange = async (data: Partial<CalendarUserSettings>) => {
        const { CalendarUserSettings } = await api<{ CalendarUserSettings: CalendarUserSettings }>(
            updateCalendarUserSettings(data)
        );
        dispatch(calendarSettingsActions.update(CalendarUserSettings));
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const {
        AutoDetectPrimaryTimezone,
        ViewPreference,
        DisplayWeekNumber,
        InviteLocale,
        AutoImportInvite,
        AutoAddConferenceLink,
    } = calendarUserSettings;
    const displayedLocale = InviteLocale === null ? null : getClosestLocaleCode(InviteLocale, locales);

    return layout(
        <div className="mobile-settings">
            <MobileSection title={c('Title').t`Time zone`}>
                <MobileSectionRow>
                    <MobileSectionLabel
                        htmlFor="autodetect-primary-timezone"
                        description={c('Info')
                            .t`If the system time zone does not match the current time zone preference, you will be asked to update it (at most once per day).`}
                    >{c('Label').t`Auto-detect primary time zone`}</MobileSectionLabel>
                    <Toggle
                        id="autodetect-primary-timezone"
                        loading={loadingAutoDetect}
                        checked={!!AutoDetectPrimaryTimezone}
                        onChange={({ target }) =>
                            withLoadingAutoDetect(handleChange({ AutoDetectPrimaryTimezone: +target.checked }))
                        }
                    />
                </MobileSectionRow>
                <MobileSectionRow stackContent>
                    <MobileSectionLabel htmlFor="primary-timezone">{c('Primary timezone')
                        .t`Primary time zone`}</MobileSectionLabel>
                    <PrimaryTimezoneSelector
                        id="primary-timezone"
                        className="mt-2"
                        calendarUserSettings={calendarUserSettings}
                    />
                </MobileSectionRow>
                <MobileSectionRow>
                    <MobileSectionLabel htmlFor="show-secondary-timezone">{c('Label')
                        .t`Show secondary time zone`}</MobileSectionLabel>
                    <ShowSecondaryTimezoneToggle calendarUserSettings={calendarUserSettings} />
                </MobileSectionRow>
                <MobileSectionRow stackContent>
                    <MobileSectionLabel htmlFor="secondary-timezone">{c('Primary timezone')
                        .t`Secondary time zone`}</MobileSectionLabel>
                    <SecondaryTimezoneSelector
                        id="secondary-timezone"
                        className="mt-2"
                        calendarUserSettings={calendarUserSettings}
                    />
                </MobileSectionRow>
            </MobileSection>

            <MobileSection title={c('Title').t`Layout`}>
                <MobileSectionRow>
                    <MobileSectionLabel
                        htmlFor="view-select"
                        description={c('Info').t`Week and month views only apply to desktop.`}
                    >{c('Label').t`Default view`}</MobileSectionLabel>
                    <div>
                        <ViewPreferenceSelector
                            id="view-select"
                            view={ViewPreference}
                            loading={loadingView}
                            onChange={(ViewPreference) => withLoadingView(handleChange({ ViewPreference }))}
                        />
                    </div>
                </MobileSectionRow>
                <MobileSectionRow>
                    <MobileSectionLabel htmlFor="week-start-select">{c('Label').t`Week start`}</MobileSectionLabel>
                    <div>
                        <WeekStartSelector />
                    </div>
                </MobileSectionRow>
                <MobileSectionRow>
                    <MobileSectionLabel htmlFor="week-numbers-display">{c('Label')
                        .t`Show week numbers`}</MobileSectionLabel>
                    <Toggle
                        id="week-numbers-display"
                        loading={loadingWeekNumbers}
                        checked={!!DisplayWeekNumber}
                        onChange={({ target }) =>
                            withLoadingWeekNumbers(handleChange({ DisplayWeekNumber: +target.checked }))
                        }
                    />
                </MobileSectionRow>
            </MobileSection>

            <MobileSection title={c('Title').t`Invitations`}>
                <MobileSectionRow>
                    <MobileSectionLabel
                        htmlFor="invite-locale"
                        description={c('Info').t`Event invitations and responses will be sent in this language.`}
                    >
                        {
                            // translator: the full sentence will be "Send invites in [LANGUAGE]", where [LANGUAGE] is a dropdown with language options. E.g. "Send invites in [ENGLISH]"
                            c('Label').t`Send in`
                        }
                    </MobileSectionLabel>
                    <div>
                        <InviteLocaleSelector
                            id="invite-locale"
                            locale={displayedLocale}
                            locales={locales}
                            loading={loadingInviteLocale}
                            onChange={(InviteLocale) => withLoadingInviteLocale(handleChange({ InviteLocale }))}
                        />
                    </div>
                </MobileSectionRow>
                <MobileSectionRow>
                    <MobileSectionLabel
                        htmlFor="auto-import-invitations"
                        description={c('Info')
                            .t`You still need to reply to invitations for the host to see your response.`}
                    >{c('Auto import invitations setting').jt`Add to calendar and mark as pending`}</MobileSectionLabel>
                    <Toggle
                        id="auto-import-invitations"
                        loading={loadingAutoImportInvite}
                        checked={!!AutoImportInvite}
                        onChange={({ target }) =>
                            withLoadingAutoImportInvite(handleChange({ AutoImportInvite: +target.checked }))
                        }
                    />
                </MobileSectionRow>
                {isMeetVideoConferenceEnabled && (
                    <MobileSectionRow>
                        <MobileSectionLabel
                            htmlFor="auto-add-meet-link"
                            description={c('Info')
                                .t`Automatically add Meet links to your calendar invitations when there is at least one invitee.`}
                        >{c('Label').t`Auto-add Meet links`}</MobileSectionLabel>
                        <Toggle
                            id="auto-add-meet-link"
                            loading={loadingAutoAddMeetLink}
                            checked={getIsAutoAddMeetLinkEnabled(AutoAddConferenceLink)}
                            onChange={() =>
                                withLoadingAutoAddMeetLink(
                                    handleChange({
                                        AutoAddConferenceLink: getToggledAutoAddMeetLink(AutoAddConferenceLink),
                                    })
                                )
                            }
                        />
                    </MobileSectionRow>
                )}
            </MobileSection>
        </div>,
        { className: 'overflow-auto' }
    );
};

export default CalendarSettings;
