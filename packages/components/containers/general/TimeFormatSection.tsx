import React, { ChangeEvent } from 'react';
import { c } from 'ttag';
import { SETTINGS_TIME_FORMAT } from 'proton-shared/lib/interfaces';
import { dateLocaleCode } from 'proton-shared/lib/i18n';
import { updateTimeFormat } from 'proton-shared/lib/api/settings';
import { loadDateLocale } from 'proton-shared/lib/i18n/loadLocale';
import { getBrowserLocale } from 'proton-shared/lib/i18n/helper';
import { getDefaultTimeFormat } from 'proton-shared/lib/settings/helper';

import { Field, Label, Row, Select } from '../../components';
import { useApi, useEventManager, useLoading, useNotifications, useUserSettings } from '../../hooks';

const TimeSection = () => {
    const api = useApi();
    const [userSettings] = useUserSettings();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const handleTimeFormat = async (value: SETTINGS_TIME_FORMAT) => {
        await loadDateLocale(dateLocaleCode, getBrowserLocale(), { ...userSettings, TimeFormat: value });
        await api(updateTimeFormat(value));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const timeFormats = [
        { text: '1:00pm', value: SETTINGS_TIME_FORMAT.H12 },
        { text: '13:00', value: SETTINGS_TIME_FORMAT.H24 },
    ];

    const defaultFormat =
        getDefaultTimeFormat() === SETTINGS_TIME_FORMAT.H12 ? timeFormats[0].text : timeFormats[1].text;

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
                        {
                            text: c('Option').t`Automatic (${defaultFormat})`,
                            value: SETTINGS_TIME_FORMAT.LOCALE_DEFAULT,
                        },
                        ...timeFormats,
                    ]}
                />
            </Field>
        </Row>
    );
};

export default TimeSection;
