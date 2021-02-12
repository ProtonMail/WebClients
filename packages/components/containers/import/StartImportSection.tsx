import React from 'react';
import { c } from 'ttag';

import { useModals, useUser } from '../../hooks';
import useOAuthPopup from '../../hooks/useOAuthPopup';
import { PrimaryButton, Alert, Icon } from '../../components';

import { OAUTH_PROVIDER } from './interfaces';
import { G_OAUTH_CLIENT_ID, G_OAUTH_SCOPE, G_OAUTH_REDIRECT_PATH } from './constants';
import ImportMailModal from './modals/ImportMailModal';

const getRedirectURL = () => {
    const { protocol, host } = window.location;
    return `${protocol}//${host}${G_OAUTH_REDIRECT_PATH}`;
};

const getAuthorizationUrl = () => {
    const params = new URLSearchParams();

    params.append('redirect_uri', getRedirectURL());
    params.append('response_type', 'code');
    params.append('access_type', 'offline');
    params.append('client_id', G_OAUTH_CLIENT_ID);
    params.append('scope', G_OAUTH_SCOPE);
    params.append('prompt', 'consent');

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

const TEST_IDS = [
    'cxinT4HnEQpRz7FHRiGu7CjH9pFULfMwqHc9mv65yycL99EohZgfRP7eMbBUMlEZG4Ks_yszjrcMzDeKD2No6w==',
    'ddjZNL8VtjZIOVR6tenP3u1Yj9s-hRLPFHuK-iDPnJunIano7ExK27dZGG41Z7t-4NQ_JJB1W2pK1N6dgEuVTA==',
    'hFe07LzzAjBB4HxpAZnIiK7nUIja1qXkdOGPAlPeToHDKd7KlFvovGzZD13Ylp1DrJ00wJkqifz58YeYlVmxFg==',
];

const StartImportSection = () => {
    const [user] = useUser();
    const { createModal } = useModals();

    const handleClick = () => createModal(<ImportMailModal />);

    const { triggerOAuthPopup } = useOAuthPopup({ getRedirectURL, getAuthorizationUrl });

    return (
        <>
            <Alert learnMore="https://protonmail.com/support/knowledge-base/import-assistant/">
                {c('Info')
                    .t`Transfer your data safely to Proton. Import Assistant connects to your external email provider and imports your selected messages and folders.`}
            </Alert>

            <div className="flex flex-flex-align-items-center">
                {TEST_IDS.includes(user.ID) ? (
                    <PrimaryButton
                        className="inline-flex flex-justify-center mt0-5 mr1"
                        onClick={() => triggerOAuthPopup(OAUTH_PROVIDER.GMAIL)}
                    >
                        <Icon name="gmail" className="mr0-5" />
                        {c('Action').t`Continue with Google`}
                    </PrimaryButton>
                ) : (
                    <PrimaryButton className="inline-flex flex-justify-center mt0-5" onClick={handleClick}>
                        <Icon name="imap-smtp" className="mr0-5" />
                        {c('Action').t`Continue with IMAP`}
                    </PrimaryButton>
                )}
            </div>
        </>
    );
};

export default StartImportSection;
