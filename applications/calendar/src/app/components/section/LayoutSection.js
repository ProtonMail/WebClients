import React from 'react';
import {
    SubTitle,
    Row,
    Label,
    Field,
    Loader,
    useApi,
    useLoading,
    useCalendarSettings,
    useEventManager,
    useNotifications
} from 'react-components';
import { c } from 'ttag';
import { updateCalendarSettings } from 'proton-shared/lib/api/calendarSettings';

import ViewSelector from '../ViewSelector';
import WeekStartSelector from '../WeekStartSelector';

const LayoutSection = () => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [calendarSettings, loadingCalendarSettings] = useCalendarSettings();

    const handleChange = async (data) => {
        await api(updateCalendarSettings(data));
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

    const { WeekStart, ViewPreference } = calendarSettings;

    return (
        <>
            <SubTitle>{c('Title').t`Layout`}</SubTitle>
            <Row>
                <Label htmlFor="view-select">{c('Label').t`Default view`}</Label>
                <Field>
                    <ViewSelector
                        id="view-select"
                        view={ViewPreference}
                        loading={loading}
                        onChange={(ViewPreference) => withLoading(handleChange({ ViewPreference }))}
                    />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="week-start-select">{c('Label').t`Week start`}</Label>
                <Field>
                    <WeekStartSelector
                        id="week-start-select"
                        day={WeekStart}
                        loading={loading}
                        onChangeDay={(WeekStart) => withLoading(handleChange({ WeekStart }))}
                    />
                </Field>
            </Row>
        </>
    );
};

export default LayoutSection;
