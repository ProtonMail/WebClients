import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';
import Toggle from '@proton/components/components/toggle/Toggle';
import { useLoading } from '@proton/hooks';
import { updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import type { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';

import { useApi, useEventManager, useNotifications } from '../../../hooks';
import { SettingsSection } from '../../account';
import SettingsLayout from '../../account/SettingsLayout';
import SettingsLayoutLeft from '../../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../../account/SettingsLayoutRight';
import WeekStartSection from '../../general/WeekStartSection';
import ViewPreferenceSelector from './ViewPreferenceSelector';

interface Props {
    calendarUserSettings: CalendarUserSettings;
}

const CalendarLayoutSection = ({ calendarUserSettings: { ViewPreference, DisplayWeekNumber } }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const [loadingView, withLoadingView] = useLoading();
    const [loadingWeekNumberDisplay, withLoadingWeekNumberDisplay] = useLoading();

    const handleChange = async (data: Partial<CalendarUserSettings>) => {
        await api(updateCalendarUserSettings(data));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return (
        <SettingsSection>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label className="text-semibold" htmlFor="view-select" id="label-view-select">
                        {c('Label').t`Default view`}{' '}
                        <Info
                            buttonClass="ml-2 inline-flex"
                            title={c('Info').t`Week and month views only apply to desktop.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    <ViewPreferenceSelector
                        id="view-select"
                        aria-describedby="label-view-select"
                        view={ViewPreference}
                        loading={loadingView}
                        onChange={(ViewPreference) => withLoadingView(handleChange({ ViewPreference }))}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
            <WeekStartSection />
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label className="text-semibold" htmlFor="week-numbers-display" id="label-week-numbers-display">
                        <span className="mr-2">{c('Label').t`Show week numbers`}</span>
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <Toggle
                        id="week-numbers-display"
                        checked={!!DisplayWeekNumber}
                        loading={loadingWeekNumberDisplay}
                        onChange={({ target: { checked } }) =>
                            withLoadingWeekNumberDisplay(handleChange({ DisplayWeekNumber: +checked }))
                        }
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
        </SettingsSection>
    );
};

export default CalendarLayoutSection;
