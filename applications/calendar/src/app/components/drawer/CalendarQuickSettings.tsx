import { c } from 'ttag';

import {
    DefaultQuickSettings,
    DrawerAllSettingsView,
    DrawerAppHeadline,
    DrawerAppScrollContainer,
    DrawerAppSection,
    DrawerDownloadApps,
    Info,
    Loader,
    QuickSettingsButtonSection,
    QuickSettingsSectionRow,
    Toggle,
    useConfirmActionModal,
} from '@proton/components';
import PrimaryTimezoneSelector from '@proton/components/containers/calendar/settings/PrimaryTimezoneSelector';
import SecondaryTimezoneSelector from '@proton/components/containers/calendar/settings/SecondaryTimezoneSelector';
import ShowSecondaryTimezoneToggle from '@proton/components/containers/calendar/settings/ShowSecondaryTimezoneToggle';
import ViewPreferenceSelector from '@proton/components/containers/calendar/settings/ViewPreferenceSelector';
import WeekStartSelector from '@proton/components/containers/calendar/settings/WeekStartSelector';
import { useApi, useCalendarUserSettings, useEventManager, useNotifications } from '@proton/components/hooks';
import { useLoading } from '@proton/hooks';
import { updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import { DEFAULT_CALENDAR_USER_SETTINGS } from '@proton/shared/lib/calendar/calendar';
import type { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';

import NukeSearchIndexButton from '../../containers/calendar/confirmationModals/NukeSearchIndexButton';

interface Props {
    onBackFromSearch: () => void;
}

const CalendarQuickSettings = ({ onBackFromSearch }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const [calendarUserSettings = DEFAULT_CALENDAR_USER_SETTINGS, loadingCalendarUserSettings] =
        useCalendarUserSettings();

    const [loadingWeekNumberDisplay, withLoadingWeekNumberDisplay] = useLoading();
    const [loadingView, withLoadingView] = useLoading();

    const [confirmModal, showConfirmModal] = useConfirmActionModal();

    const handleChange = async (data: Partial<CalendarUserSettings>) => {
        await api(updateCalendarUserSettings(data));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const handleChangeShowWeekNumbers = async (show: number) => {
        await api(updateCalendarUserSettings({ DisplayWeekNumber: show }));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    if (loadingCalendarUserSettings) {
        return <Loader />;
    }

    return (
        <DrawerAppScrollContainer>
            <DrawerAllSettingsView />
            <DrawerDownloadApps />

            <DrawerAppSection>
                <QuickSettingsSectionRow
                    label={c('Label').t`Default view`}
                    labelInfo={<Info title={c('Info').t`Week and month views only apply to desktop.`} />}
                    action={
                        <ViewPreferenceSelector
                            id="view-select"
                            view={calendarUserSettings.ViewPreference}
                            loading={loadingView}
                            onChange={(ViewPreference) => withLoadingView(handleChange({ ViewPreference }))}
                            className="quickSettingsSectionRow-select w-auto"
                            unstyledSelect
                        />
                    }
                />

                <QuickSettingsSectionRow
                    label={c('Label').t`Week start`}
                    action={
                        <WeekStartSelector className="quickSettingsSectionRow-select w-auto" unstyledSelect shortText />
                    }
                />

                <QuickSettingsSectionRow
                    label={c('Label').t`Show week numbers`}
                    action={
                        <Toggle
                            id="week-numbers-display"
                            aria-describedby="week-numbers-display"
                            checked={!!calendarUserSettings.DisplayWeekNumber}
                            loading={loadingWeekNumberDisplay}
                            onChange={({ target: { checked } }) =>
                                withLoadingWeekNumberDisplay(handleChangeShowWeekNumbers(+checked))
                            }
                        />
                    }
                />
            </DrawerAppSection>

            <DrawerAppSection>
                <DrawerAppHeadline>{c('Label').t`Time zone`}</DrawerAppHeadline>

                <QuickSettingsSectionRow
                    // translator: As in Primary time zone
                    label={c('Label').t`Primary`}
                    action={
                        <PrimaryTimezoneSelector
                            id="primary-timezone"
                            calendarUserSettings={calendarUserSettings}
                            className="w-auto"
                            abbreviatedTimezone="city"
                            unstyledSelect
                            selectMaxHeight="20rem"
                            data-testid="quick-settings/primary-time-zone:dropdown"
                            tooltip
                        />
                    }
                />

                <QuickSettingsSectionRow
                    // translator: As in "Show secondary time zone"
                    label={c('Label').t`Secondary time zone`}
                    action={<ShowSecondaryTimezoneToggle calendarUserSettings={calendarUserSettings} />}
                />

                {!!calendarUserSettings.DisplaySecondaryTimezone && (
                    <QuickSettingsSectionRow
                        // translator: As in secondary time zone
                        label={c('Label').t`Secondary`}
                        action={
                            <SecondaryTimezoneSelector
                                id="secondary-timezone"
                                calendarUserSettings={calendarUserSettings}
                                className="w-auto"
                                abbreviatedTimezone="city"
                                unstyledSelect
                                selectMaxHeight="20rem"
                                data-testid="quick-settings/secondary-time-zone:dropdown"
                                tooltip
                            />
                        }
                    />
                )}
            </DrawerAppSection>
            <DefaultQuickSettings />
            <QuickSettingsButtonSection>
                <NukeSearchIndexButton showConfirmModal={showConfirmModal} onBackFromSearch={onBackFromSearch} />
            </QuickSettingsButtonSection>
            {confirmModal}
        </DrawerAppScrollContainer>
    );
};

export default CalendarQuickSettings;
