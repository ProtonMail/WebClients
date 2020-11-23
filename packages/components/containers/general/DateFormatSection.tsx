import React, { ChangeEvent } from 'react';
import { c } from 'ttag';
import { SETTINGS_DATE_FORMAT } from 'proton-shared/lib/interfaces';
import { updateDateFormat } from 'proton-shared/lib/api/settings';
import { loadDateLocale } from 'proton-shared/lib/i18n/loadLocale';
import { dateLocaleCode } from 'proton-shared/lib/i18n';
import { getBrowserLocale } from 'proton-shared/lib/i18n/helper';
import { getDefaultDateFormat } from 'proton-shared/lib/settings/helper';

import { Row, Label, Field, Select } from '../../components';
import { useApi, useEventManager, useNotifications, useLoading, useUserSettings } from '../../hooks';

const DateFormatSection = () => {
    const api = useApi();
    const [userSettings] = useUserSettings();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const handleDateFormat = async (value: SETTINGS_DATE_FORMAT) => {
        await loadDateLocale(dateLocaleCode, getBrowserLocale(), { ...userSettings, DateFormat: value });
        await api(updateDateFormat(value));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const defaultFormat = getDefaultDateFormat()?.toUpperCase();

    return (
        <Row>
            <Label htmlFor="date-format-select">{c('Label').t`Date format`}</Label>
            <Field>
                <Select
                    id="date-format-select"
                    loading={loading}
                    onChange={({ target }: ChangeEvent<HTMLSelectElement>) =>
                        withLoading(handleDateFormat(+target.value))
                    }
                    value={userSettings.DateFormat}
                    options={[
                        {
                            text: c('Option').t`Use browser settings (${defaultFormat})`,
                            value: SETTINGS_DATE_FORMAT.LOCALE_DEFAULT,
                        },
                        { text: 'DD/MM/YYYY', value: SETTINGS_DATE_FORMAT.DDMMYYYY },
                        { text: 'MM/DD/YYYY', value: SETTINGS_DATE_FORMAT.MMDDYYYY },
                        { text: 'YYYY/MM/DD', value: SETTINGS_DATE_FORMAT.YYYYMMDD },
                    ]}
                />
            </Field>
        </Row>
    );
};

export default DateFormatSection;
