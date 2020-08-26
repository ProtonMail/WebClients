import React, { ChangeEvent } from 'react';
import { c } from 'ttag';
import { SETTINGS_TIME_FORMAT } from 'proton-shared/lib/interfaces/calendar';
import updateLongLocale from 'proton-shared/lib/i18n/updateLongLocale';
import { isMilitaryTime } from 'proton-shared/lib/i18n/dateFnLocale';
import { updateTimeFormat } from 'proton-shared/lib/api/settings';

import { Row, Label, Field, Select } from '../../components';
import { useApi, useEventManager, useNotifications, useLoading, useUserSettings } from '../../hooks';

const TimeSection = () => {
    const api = useApi();
    const [userSettings] = useUserSettings();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const handleTimeFormat = async (value: SETTINGS_TIME_FORMAT) => {
        await api(updateTimeFormat(value));
        await call();
        updateLongLocale({
            displayAMPM:
                value === SETTINGS_TIME_FORMAT.LOCALE_DEFAULT ? !isMilitaryTime() : value === SETTINGS_TIME_FORMAT.H12,
        });
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return (
        <Row>
            <Label htmlFor="time-format-select">{c('Label').t`Time format`}</Label>
            <Field>
                <Select
                    id="time-format-select"
                    loading={loading}
                    onChange={({ target }: ChangeEvent<HTMLSelectElement>) =>
                        withLoading(handleTimeFormat(+target.value))
                    }
                    value={userSettings.TimeFormat}
                    options={[
                        { text: c('Option').t`Use system settings`, value: SETTINGS_TIME_FORMAT.LOCALE_DEFAULT },
                        { text: '1:00pm', value: SETTINGS_TIME_FORMAT.H12 },
                        { text: '13:00', value: SETTINGS_TIME_FORMAT.H24 },
                    ]}
                />
            </Field>
        </Row>
    );
};

export default TimeSection;
