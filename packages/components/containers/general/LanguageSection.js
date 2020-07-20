import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import {
    Row,
    Field,
    Label,
    Select,
    useApi,
    useConfig,
    useLoading,
    useNotifications,
    useForceRefresh,
    useEventManager,
    useUserSettings,
} from 'react-components';
import { updateLocale } from 'proton-shared/lib/api/settings';
import loadLocale from 'proton-shared/lib/i18n/loadLocale';
import { getBrowserLocale, getClosestMatches } from 'proton-shared/lib/i18n/helper';

const LanguageSection = ({ locales = {} }) => {
    const api = useApi();
    const { call } = useEventManager();
    const { LOCALES = {} } = useConfig();
    const [{ Locale }] = useUserSettings();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const forceRefresh = useForceRefresh();

    const options = Object.keys(LOCALES).map((value) => ({
        text: LOCALES[value],
        value,
    }));

    const handleChange = async ({ target }) => {
        const newLocale = target.value;
        await api(updateLocale(newLocale));
        await loadLocale({
            ...getClosestMatches({
                locale: newLocale,
                browserLocale: getBrowserLocale(),
                locales,
            }),
            locales,
        });
        await call();
        createNotification({ text: c('Success').t`Locale updated` });
        forceRefresh();
    };

    return (
        <Row>
            <Label htmlFor="languageSelect">{c('Label').t`Default language`}</Label>
            <Field>
                <Select
                    disabled={loading}
                    value={Locale}
                    id="languageSelect"
                    options={options}
                    onChange={(e) => {
                        withLoading(handleChange(e));
                    }}
                />
            </Field>
        </Row>
    );
};

LanguageSection.propTypes = {
    locales: PropTypes.object.isRequired,
};

export default LanguageSection;
