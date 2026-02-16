import { c } from 'ttag';

import { useCalendarUserSettings } from '@proton/calendar/calendarUserSettings/hooks';
import { useConfirmActionModal } from '@proton/components/components/confirmActionModal/ConfirmActionModal';
import DefaultQuickSettings from '@proton/components/components/drawer/views/quickSettings/DefaultQuickSettings';
import DrawerAllSettingsView from '@proton/components/components/drawer/views/quickSettings/DrawerAllSettingsView';
import DrawerDownloadApps from '@proton/components/components/drawer/views/quickSettings/DrawerDownloadApps';
import QuickSettingsButtonSection from '@proton/components/components/drawer/views/quickSettings/QuickSettingsButtonSection';
import { QuickSettingsRequestNotifications } from '@proton/components/components/drawer/views/quickSettings/QuickSettingsRequestNotifications';
import QuickSettingsSectionRow from '@proton/components/components/drawer/views/quickSettings/QuickSettingsSectionRow';
import DrawerAppHeadline from '@proton/components/components/drawer/views/shared/DrawerAppHeadline';
import DrawerAppScrollContainer from '@proton/components/components/drawer/views/shared/DrawerAppScrollContainer';
import DrawerAppSection from '@proton/components/components/drawer/views/shared/DrawerAppSection';
import Info from '@proton/components/components/link/Info';
import Loader from '@proton/components/components/loader/Loader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Toggle from '@proton/components/components/toggle/Toggle';
import PrimaryTimezoneSelector from '@proton/components/containers/calendar/settings/PrimaryTimezoneSelector';
import SecondaryTimezoneSelector from '@proton/components/containers/calendar/settings/SecondaryTimezoneSelector';
import ShowSecondaryTimezoneToggle from '@proton/components/containers/calendar/settings/ShowSecondaryTimezoneToggle';
import ViewPreferenceSelector from '@proton/components/containers/calendar/settings/ViewPreferenceSelector';
import WeekStartSelector from '@proton/components/containers/calendar/settings/WeekStartSelector';
import CalendarShortcutsModal from '@proton/components/containers/calendar/shortcutsModal/CalendarShortcutsModal';
import ShortcutsToggle from '@proton/components/containers/general/ShortcutsToggle';
import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
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
    const [calendarShortcutsProps, setCalendarShortcutsModalOpen, renderCalendarShortcutsModal] = useModalState();

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

            <DrawerAppSection>
                <QuickSettingsSectionRow
                    label={c('Label').t`Keyboard shortcuts`}
                    labelInfo={
                        <Info
                            title={c('Info').t`Open shortcut cheat sheet`}
                            onClick={() => setCalendarShortcutsModalOpen(true)}
                            data-testid="calendar-quick-settings:keyboard-shortcuts-info"
                        />
                    }
                    labelProps={{ htmlFor: 'toggle-shortcuts' }}
                    action={
                        <ShortcutsToggle
                            id="toggle-shortcuts"
                            data-testid="calendar-quick-settings:keyboard-shortcuts-toggle"
                        />
                    }
                />
            </DrawerAppSection>

            <DefaultQuickSettings />

            <QuickSettingsRequestNotifications />

            <QuickSettingsButtonSection>
                <NukeSearchIndexButton showConfirmModal={showConfirmModal} onBackFromSearch={onBackFromSearch} />
            </QuickSettingsButtonSection>
            {confirmModal}
            {renderCalendarShortcutsModal && <CalendarShortcutsModal {...calendarShortcutsProps} />}
        </DrawerAppScrollContainer>
    );
};

export default CalendarQuickSettings;
