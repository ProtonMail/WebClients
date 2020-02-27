import React from 'react';
import PropTypes from 'prop-types';
import {
    SubTitle,
    Row,
    Info,
    Label,
    Field,
    Checkbox,
    useApi,
    useLoading,
    useEventManager,
    useNotifications
} from 'react-components';
import { c } from 'ttag';
import { updateCalendarUserSettings } from 'proton-shared/lib/api/calendars';

import WeekStartSelector from '../WeekStartSelector';
import ViewPreferenceSelector from '../ViewPreferenceSelector';

const LayoutSection = ({ calendarUserSettings: { WeekStart, ViewPreference, DisplayWeekNumber } }) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const [loadingView, withLoadingView] = useLoading();
    const [loadingWeekStart, withLoadingWeekStart] = useLoading();
    const [loadingWeekNumberDisplay, withLoadingWeekNumberDisplay] = useLoading();

    const handleChange = async (data) => {
        await api(updateCalendarUserSettings(data));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return (
        <>
            <SubTitle>{c('Title').t`Layout`}</SubTitle>
            <Row>
                <Label htmlFor="view-select">
                    {c('Label').t`Default view`}{' '}
                    <Info
                        buttonClass="ml0-5 inline-flex"
                        title={c('Info').t`Week and month views only apply to desktop.`}
                    />
                </Label>
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
                <Label htmlFor="week-numbers-display">{c('Label').t`Week numbers`}</Label>
                <Field className="pt0-25">
                    <Checkbox
                        id="week-numbers-display"
                        checked={!!DisplayWeekNumber}
                        loading={loadingWeekNumberDisplay}
                        onChange={({ target: { checked } }) =>
                            withLoadingWeekNumberDisplay(handleChange({ DisplayWeekNumber: +checked }))
                        }
                    >{c('Checkbox').t`Show week numbers`}</Checkbox>
                </Field>
            </Row>
        </>
    );
};

LayoutSection.propTypes = {
    calendarUserSettings: PropTypes.shape({
        WeekStart: PropTypes.number,
        ViewPreference: PropTypes.number,
        DisplayWeekNumber: PropTypes.number
    })
};

export default LayoutSection;
