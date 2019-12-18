import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
    Info,
    SubTitle,
    Row,
    Label,
    Field,
    Select,
    useEventManager,
    useNotifications,
    useApi,
    useLoading,
    Checkbox
} from 'react-components';
import { c } from 'ttag';
import { updateCalendarUserSettings } from 'proton-shared/lib/api/calendars';
import updateLongLocale from 'proton-shared/lib/i18n/updateLongLocale';

import TimezoneSelector from '../../../components/TimezoneSelector';
import { SETTINGS_TIME_FORMAT } from '../../../constants';
import { getTimezone } from 'proton-shared/lib/date/timezone';

const TimeSection = ({
    calendarSettings: {
        AutoDetectPrimaryTimezone,
        DisplaySecondaryTimezone,
        TimeFormat,
        PrimaryTimezone,
        SecondaryTimezone
    }
}) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const [timezone] = useState(() => getTimezone());

    const [loadingTimeFormat, withLoadingTimeFormat] = useLoading();
    const [loadingAutoDetect, withLoadingAutoDetect] = useLoading();
    const [loadingPrimaryTimeZone, withLoadingPrimaryTimeZone] = useLoading();
    const [loadingSecondaryTimeZone, withLoadingSecondaryTimeZone] = useLoading();
    const [loadingDisplaySecondaryTimezone, withLoadingDisplaySecondaryTimezone] = useLoading();

    const handleChange = async (data) => {
        await api(updateCalendarUserSettings(data));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const handleTimeFormat = async (value) => {
        await api(updateCalendarUserSettings({ TimeFormat: value }));
        await call();
        updateLongLocale({ displayAMPM: value === SETTINGS_TIME_FORMAT.H12 });
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const primaryTimezoneValue = PrimaryTimezone;
    const secondaryTimezoneValue = DisplaySecondaryTimezone
        ? SecondaryTimezone || timezone
        : SecondaryTimezone || timezone;

    return (
        <>
            <SubTitle>{c('Title').t`Region & time zone`}</SubTitle>
            <Row>
                <Label htmlFor="time-format-select">{c('Label').t`Time format`}</Label>
                <Field>
                    <Select
                        id="time-format-select"
                        loading={loadingTimeFormat}
                        onChange={({ target }) => withLoadingTimeFormat(handleTimeFormat(+target.value))}
                        value={TimeFormat}
                        options={[
                            { text: '12h', value: SETTINGS_TIME_FORMAT.H12 },
                            { text: '24h', value: SETTINGS_TIME_FORMAT.H24 }
                        ]}
                    />
                </Field>
            </Row>
            <Row>
                <Label id="label-primary-timezone">{c('Primary timezone').t`Primary time zone`}</Label>
                <Field className="pt0-25">
                    <div className="mb1">
                        <Checkbox
                            disabled={loadingAutoDetect}
                            aria-describedby="label-primary-timezone"
                            checked={!!AutoDetectPrimaryTimezone}
                            onChange={({ target }) =>
                                withLoadingAutoDetect(
                                    handleChange({
                                        AutoDetectPrimaryTimezone: +target.checked,
                                        // Set a timezone if it's the first time
                                        PrimaryTimezone: !PrimaryTimezone ? primaryTimezoneValue : undefined
                                    })
                                )
                            }
                        >
                            {c('Checkbox').t`Ask to update primary time zone`}
                            <Info
                                className="ml0-5"
                                title={c('Tooltip')
                                    .t`If the computer time zone does not match the current time zone preference, you will be asked to update it (at most once per day). `}
                            />
                        </Checkbox>
                    </div>
                    <div>
                        <TimezoneSelector
                            loading={loadingPrimaryTimeZone}
                            timezone={primaryTimezoneValue}
                            onChange={(PrimaryTimezone) =>
                                withLoadingPrimaryTimeZone(handleChange({ PrimaryTimezone }))
                            }
                        />
                    </div>
                </Field>
            </Row>
            <Row>
                <Label>{c('Secondary timezone').t`Secondary time zone`}</Label>
                <Field className="pt0-25">
                    <div className="mb1">
                        <Checkbox
                            disabled={loadingDisplaySecondaryTimezone}
                            checked={!!DisplaySecondaryTimezone}
                            onChange={({ target }) =>
                                withLoadingDisplaySecondaryTimezone(
                                    handleChange({
                                        DisplaySecondaryTimezone: +target.checked,
                                        // Set a timezone if it's the first time
                                        SecondaryTimezone: !SecondaryTimezone ? secondaryTimezoneValue : undefined
                                    })
                                )
                            }
                        >{c('Checkbox').t`Show secondary time zone`}</Checkbox>
                    </div>
                    <div>
                        <TimezoneSelector
                            loading={loadingSecondaryTimeZone}
                            disabled={!DisplaySecondaryTimezone}
                            timezone={secondaryTimezoneValue}
                            onChange={(SecondaryTimezone) =>
                                withLoadingSecondaryTimeZone(handleChange({ SecondaryTimezone }))
                            }
                        />
                    </div>
                </Field>
            </Row>
        </>
    );
};

TimeSection.propTypes = {
    calendarSettings: PropTypes.object,
    keepTimezone: PropTypes.bool
};

export default TimeSection;
