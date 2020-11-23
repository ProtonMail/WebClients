import React, { ChangeEvent } from 'react';
import { c } from 'ttag';
import { SETTINGS_WEEK_START } from 'proton-shared/lib/interfaces';
import { updateWeekStart } from 'proton-shared/lib/api/settings';
import { loadDateLocale } from 'proton-shared/lib/i18n/loadLocale';
import { dateLocaleCode } from 'proton-shared/lib/i18n';
import { getDefaultWeekStartsOn } from 'proton-shared/lib/settings/helper';
import { getBrowserLocale } from 'proton-shared/lib/i18n/helper';

import { Row, Label, Field, Select } from '../../components';
import { useApi, useEventManager, useNotifications, useLoading, useUserSettings } from '../../hooks';

const WeekStartSection = () => {
    const api = useApi();
    const [userSettings] = useUserSettings();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const handleWeekStart = async (value: SETTINGS_WEEK_START) => {
        await loadDateLocale(dateLocaleCode, getBrowserLocale(), { ...userSettings, WeekStart: value });
        await api(updateWeekStart(value));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const days = [
        { text: c('Day').t`Sunday`, value: SETTINGS_WEEK_START.SUNDAY },
        { text: c('Day').t`Monday`, value: SETTINGS_WEEK_START.MONDAY },
        { text: c('Day').t`Tuesday`, value: SETTINGS_WEEK_START.TUESDAY },
        { text: c('Day').t`Wednesday`, value: SETTINGS_WEEK_START.WEDNESDAY },
        { text: c('Day').t`Thursday`, value: SETTINGS_WEEK_START.THURSDAY },
        { text: c('Day').t`Friday`, value: SETTINGS_WEEK_START.FRIDAY },
        { text: c('Day').t`Saturday`, value: SETTINGS_WEEK_START.SATURDAY },
    ];

    const defaultDay = days[getDefaultWeekStartsOn()].text;

    return (
        <Row>
            <Label htmlFor="week-start-select">{c('Label').t`Week start`}</Label>
            <Field>
                <Select
                    id="week-start-select"
                    loading={loading}
                    onChange={({ target }: ChangeEvent<HTMLSelectElement>) =>
                        withLoading(handleWeekStart(+target.value))
                    }
                    value={userSettings.WeekStart}
                    options={[
                        {
                            text: c('Option').t`Use browser settings (${defaultDay})`,
                            value: SETTINGS_WEEK_START.LOCALE_DEFAULT,
                        },
                        days[0],
                        days[1],
                        days[6],
                    ]}
                />
            </Field>
        </Row>
    );
};

export default WeekStartSection;
