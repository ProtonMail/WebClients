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
import WeekStartSelector from '@proton/components/containers/calendar/settings/WeekStartSelector';
import {
    getIsAutoAddMeetLinkEnabled,
    getToggledAutoAddMeetLink,
} from '@proton/components/containers/calendar/settings/autoAddMeetLink';
import { useIsMeetVideoConferenceEnabled } from '@proton/components/containers/calendar/settings/useIsMeetVideoConferenceEnabled';
import LanguageSelector from '@proton/components/containers/general/LanguageSelector';
import TimeFormatSelector from '@proton/components/containers/general/TimeFormatSelector';
import useLoading from '@proton/hooks/useLoading';
import { updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import { getClosestLocaleCode } from '@proton/shared/lib/i18n/helper';
import { locales } from '@proton/shared/lib/i18n/locales';
import type { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar/Calendar';

import { useAccountDispatch } from '../../../private-app/store/hooks';
import LiteSettingsPage from '../../components/settings/LiteSettingsPage';
import LiteSettingsRow from '../../components/settings/LiteSettingsRow';
import LiteSettingsSection from '../../components/settings/LiteSettingsSection';

interface Props {
    layout: (children: ReactNode, props?: any) => ReactNode;
    loader: ReactNode;
}

const CalendarSettings = ({ layout, loader }: Props) => {
    const api = useApi();
    const dispatch = useAccountDispatch();
    const { createNotification } = useNotifications();

    // Read by WeekStartSelector, LanguageSelector and TimeFormatSelector, and not preloaded by the lite app
    const [userSettings, loadingUserSettings] = useUserSettings();
    const [calendarUserSettings, loadingCalendarUserSettings] = useCalendarUserSettings();

    const isMeetVideoConferenceEnabled = useIsMeetVideoConferenceEnabled();

    const [loadingAutoDetect, withLoadingAutoDetect] = useLoading();
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

    const { AutoDetectPrimaryTimezone, DisplayWeekNumber, InviteLocale, AutoImportInvite, AutoAddConferenceLink } =
        calendarUserSettings;
    const displayedLocale = InviteLocale === null ? null : getClosestLocaleCode(InviteLocale, locales);

    return layout(
        <LiteSettingsPage>
            <LiteSettingsSection title={c('Title').t`Time zone`}>
                <LiteSettingsRow
                    htmlFor="autodetect-primary-timezone"
                    label={c('Label').t`Auto-detect primary time zone`}
                    description={c('Info')
                        .t`If the system time zone does not match the current time zone preference, you will be asked to update it (at most once per day).`}
                >
                    <Toggle
                        id="autodetect-primary-timezone"
                        loading={loadingAutoDetect}
                        checked={!!AutoDetectPrimaryTimezone}
                        onChange={({ target }) =>
                            withLoadingAutoDetect(handleChange({ AutoDetectPrimaryTimezone: +target.checked }))
                        }
                    />
                </LiteSettingsRow>
                <LiteSettingsRow htmlFor="primary-timezone" label={c('Primary timezone').t`Primary time zone`}>
                    <PrimaryTimezoneSelector
                        id="primary-timezone"
                        calendarUserSettings={calendarUserSettings}
                        unstyledSelect
                        aria-labelledby="primary-timezone-label"
                    />
                </LiteSettingsRow>
            </LiteSettingsSection>

            <LiteSettingsSection title={c('Title').t`Layout`}>
                <LiteSettingsRow htmlFor="week-start-select" label={c('Label').t`Week start`}>
                    <WeekStartSelector unstyledSelect aria-labelledby="week-start-select-label" />
                </LiteSettingsRow>
                <LiteSettingsRow htmlFor="week-numbers-display" label={c('Label').t`Show week numbers`}>
                    <Toggle
                        id="week-numbers-display"
                        loading={loadingWeekNumbers}
                        checked={!!DisplayWeekNumber}
                        onChange={({ target }) =>
                            withLoadingWeekNumbers(handleChange({ DisplayWeekNumber: +target.checked }))
                        }
                    />
                </LiteSettingsRow>
            </LiteSettingsSection>

            <LiteSettingsSection title={c('Title').t`Language and time`}>
                <LiteSettingsRow htmlFor="language-select" label={c('Label').t`Default language`}>
                    <LanguageSelector
                        id="language-select"
                        locales={locales}
                        unstyledSelect
                        aria-labelledby="language-select-label"
                    />
                </LiteSettingsRow>
                <LiteSettingsRow htmlFor="time-format-select" label={c('Label').t`Time format`}>
                    <TimeFormatSelector
                        id="time-format-select"
                        unstyledSelect
                        aria-labelledby="time-format-select-label"
                    />
                </LiteSettingsRow>
            </LiteSettingsSection>

            <LiteSettingsSection title={c('Title').t`Invitations`}>
                <LiteSettingsRow
                    htmlFor="invite-locale"
                    label={
                        // translator: the full sentence will be "Send invites in [LANGUAGE]", where [LANGUAGE] is a dropdown with language options. E.g. "Send invites in [ENGLISH]"
                        c('Label').t`Send in`
                    }
                    description={c('Info').t`Event invitations and responses will be sent in this language.`}
                >
                    <InviteLocaleSelector
                        id="invite-locale"
                        className=""
                        locale={displayedLocale}
                        locales={locales}
                        loading={loadingInviteLocale}
                        unstyledSelect
                        aria-labelledby="invite-locale-label"
                        onChange={(InviteLocale) => withLoadingInviteLocale(handleChange({ InviteLocale }))}
                    />
                </LiteSettingsRow>
                <LiteSettingsRow
                    htmlFor="auto-import-invitations"
                    label={c('Auto import invitations setting').jt`Add to calendar and mark as pending`}
                    description={c('Info').t`You still need to reply for the organizer to see your response.`}
                >
                    <Toggle
                        id="auto-import-invitations"
                        loading={loadingAutoImportInvite}
                        checked={!!AutoImportInvite}
                        onChange={({ target }) =>
                            withLoadingAutoImportInvite(handleChange({ AutoImportInvite: +target.checked }))
                        }
                    />
                </LiteSettingsRow>
                {isMeetVideoConferenceEnabled && (
                    <LiteSettingsRow
                        htmlFor="auto-add-meet-link"
                        label={c('Label').t`Auto-add Meet links`}
                        description={c('Info').t`Adds a Meet link to events with at least one participant.`}
                    >
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
                    </LiteSettingsRow>
                )}
            </LiteSettingsSection>
        </LiteSettingsPage>,
        { className: 'overflow-auto' }
    );
};

export default CalendarSettings;
