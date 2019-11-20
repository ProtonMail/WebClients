import React from 'react';
import {
    SubTitle,
    Row,
    Label,
    Field,
    Checkbox,
    Loader,
    useApi,
    useLoading,
    useEventManager,
    useNotifications,
    useCalendarUserSettings
} from 'react-components';
import { c } from 'ttag';
import { updateCalendarUserSettings } from 'proton-shared/lib/api/calendars';

import WeekStartSelector from '../WeekStartSelector';
import ViewPreferenceSelector from '../ViewPreferenceSelector';

const LayoutSection = () => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const [loadingView, withLoadingView] = useLoading();
    const [loadingWeekStart, withLoadingWeekStart] = useLoading();
    const [loadingWeekNumberDisplay, withLoadingWeekNumberDisplay] = useLoading();

    const [calendarSettings, loadingCalendarSettings] = useCalendarUserSettings();

    const handleChange = async (data) => {
        await api(updateCalendarUserSettings(data));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    if (loadingCalendarSettings) {
        return (
            <>
                <SubTitle>{c('Title').t`Layout`}</SubTitle>
                <Loader />
            </>
        );
    }

    const { WeekStart, ViewPreference, DisplayWeekNumber } = calendarSettings;

    return (
        <>
            <SubTitle>{c('Title').t`Layout`}</SubTitle>
            <Row>
                <Label htmlFor="view-select">{c('Label').t`Default view`}</Label>
                <Field>
                    <ViewPreferenceSelector
                        id="view-select"
                        view={ViewPreference}
                        loading={loadingView}
                        onChange={(ViewPreference) => withLoadingView(handleChange({ ViewPreference }))}
                    />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="week-start-select">{c('Label').t`Week start`}</Label>
                <Field>
                    <WeekStartSelector
                        id="week-start-select"
                        day={WeekStart}
                        loading={loadingWeekStart}
                        onChangeDay={(WeekStart) => withLoadingWeekStart(handleChange({ WeekStart }))}
                    />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="week-numbers-display">{c('Label').t`Show week numbers`}</Label>
                <Field className="pt0-25">
                    <Checkbox
                        id="week-numbers-display"
                        checked={!!DisplayWeekNumber}
                        loading={loadingWeekNumberDisplay}
                        onChange={({ target: { checked } }) =>
                            withLoadingWeekNumberDisplay(handleChange({ DisplayWeekNumber: +checked }))
                        }
                    />
                </Field>
            </Row>
        </>
    );
};

export default LayoutSection;
