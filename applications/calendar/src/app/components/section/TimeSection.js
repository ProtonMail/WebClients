import React from 'react';
import {
    SubTitle,
    Row,
    Label,
    Field,
    Select,
    Loader,
    useEventManager,
    useCalendarSettings,
    useNotifications,
    useApi,
    useLoading,
    Checkbox
} from 'react-components';
import { c } from 'ttag';
import { updateCalendarSettings } from 'proton-shared/lib/api/calendarSettings';

import TimezoneSelector from '../TimezoneSelector';
import { MMDDYYYY, DDMMYYYY, H24, H12 } from '../../constants';

const TimeSection = () => {
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
                <SubTitle>{c('Title').t`Region & time zone`}</SubTitle>
                <Loader />
            </>
        );
    }

    const {
        AutoDetectPrimaryTimezone,
        DisplaySecondaryTimezone,
        DateFormat,
        TimeFormat,
        PrimaryTimezone,
        SecondaryTimezone
    } = calendarSettings;

    return (
        <>
            <SubTitle>{c('Title').t`Region & time zone`}</SubTitle>
            <Row>
                <Label htmlFor="date-format-select">{c('Label').t`Date format`}</Label>
                <Field>
                    <Select
                        id="date-format-select"
                        loading={loading}
                        onChange={({ target }) => withLoading(handleChange({ DateFormat: +target.value }))}
                        value={DateFormat}
                        options={[{ text: '12/31/2019', value: DDMMYYYY }, { text: '31/12/2019', value: MMDDYYYY }]}
                    />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="time-format-select">{c('Label').t`Time format`}</Label>
                <Field>
                    <Select
                        id="time-format-select"
                        loading={loading}
                        onChange={({ target }) => withLoading(handleChange({ TimeFormat: +target.value }))}
                        value={TimeFormat}
                        options={[{ text: '1pm', value: H12 }, { text: '13:00', value: H24 }]}
                    />
                </Field>
            </Row>
            <Row>
                <Label>{c('Primary timezone').t`Primary time`}</Label>
                <Field>
                    <div className="mb1">
                        <Checkbox
                            loading={loading}
                            checked={!!AutoDetectPrimaryTimezone}
                            onChange={({ target }) =>
                                withLoading(handleChange({ AutoDetectPrimaryTimezone: +target.checked }))
                            }
                        >{c('Checkbox').t`Auto-detect`}</Checkbox>
                    </div>
                    <div>
                        <TimezoneSelector
                            loading={loading}
                            disabled={!!AutoDetectPrimaryTimezone}
                            timezone={PrimaryTimezone}
                            onChange={(PrimaryTimezone) => withLoading(handleChange({ PrimaryTimezone }))}
                        />
                    </div>
                </Field>
            </Row>
            <Row>
                <Label>{c('Secondary timezone').t`Secondary time`}</Label>
                <Field>
                    <div className="mb1">
                        <Checkbox
                            loading={loading}
                            checked={!!DisplaySecondaryTimezone}
                            onChange={({ target }) =>
                                withLoading(handleChange({ DisplaySecondaryTimezone: +target.checked }))
                            }
                        >{c('Checkbox').t`Display second time zone`}</Checkbox>
                    </div>
                    <div>
                        <TimezoneSelector
                            loading={loading}
                            disabled={!DisplaySecondaryTimezone}
                            timezone={SecondaryTimezone}
                            onChange={(SecondaryTimezone) => withLoading(handleChange({ SecondaryTimezone }))}
                        />
                    </div>
                </Field>
            </Row>
        </>
    );
};

export default TimeSection;
