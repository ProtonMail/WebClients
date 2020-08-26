import React, { ChangeEvent } from 'react';
import { c } from 'ttag';
import { SETTINGS_WEEK_START } from 'proton-shared/lib/interfaces/calendar';
import { updateWeekStart } from 'proton-shared/lib/api/settings';

import { Row, Label, Field, Select } from '../../components';
import { useApi, useEventManager, useNotifications, useLoading, useUserSettings } from '../../hooks';

const WeekStartSection = () => {
    const api = useApi();
    const [userSettings] = useUserSettings();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const handleWeekStart = async (value: SETTINGS_WEEK_START) => {
        await api(updateWeekStart(value));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

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
                        { text: c('Option').t`Use system settings`, value: SETTINGS_WEEK_START.LOCALE_DEFAULT },
                        { text: c('Day').t`Monday`, value: SETTINGS_WEEK_START.MONDAY },
                        { text: c('Day').t`Saturday`, value: SETTINGS_WEEK_START.SATURDAY },
                        { text: c('Day').t`Sunday`, value: SETTINGS_WEEK_START.SUNDAY },
                    ]}
                />
            </Field>
        </Row>
    );
};

export default WeekStartSection;
