import React, { useEffect, useState } from 'react';
import { LoaderPage, GenericError, ModalsChildren } from 'react-components';
import PropTypes from 'prop-types';
import { loadOpenPGP } from 'proton-shared/lib/openpgp';
import { getBrowserLocale, loadLocale } from 'proton-shared/lib/i18n';

const StandardPublicApp = ({ locales = {}, children }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        (async () => {
            await Promise.all([loadOpenPGP(), loadLocale(getBrowserLocale(), locales)]);
        })()
            .then(() => setLoading(false))
            .catch(() => setError(true));
    }, []);

    if (error) {
        return <GenericError />;
    }

    if (loading) {
        return <LoaderPage />;
    }

    return (
        <>
            <ModalsChildren />
            {children}
        </>
    );
};

StandardPublicApp.propTypes = {
    locales: PropTypes.object,
    children: PropTypes.node
};

export default StandardPublicApp;
