import React from 'react';
import { c } from 'ttag';
import { Link } from 'react-router-dom';
import { ADDRESS_TYPE } from 'proton-shared/lib/constants';
import { Alert, Paragraph, useUser, useAddresses } from 'react-components';

import PmMeButton from './PmMeButton';

const PmMePanel = () => {
    const [user] = useUser();
    const [addresses] = useAddresses();
    const hasPremium = addresses.find(({ Type }) => Type === ADDRESS_TYPE.TYPE_PREMIUM);

    if (!hasPremium) {
        return (
            <>
                <Alert learnMore="https://protonmail.com/support/knowledge-base/pm-me-addresses/">{c('Info')
                    .t`ProtonMail now supports @pm.me email addresses (short for ProtonMail me or Private Message me). Paid users can add other @pm.me addresses.`}</Alert>
                <PmMeButton />
            </>
        );
    }

    if (user.hasPaidMail) {
        return (
            <>
                <Alert learnMore="https://protonmail.com/support/knowledge-base/pm-me-addresses/">{c('Info')
                    .t`You can now also receive and send messages from your @pm.me address (short for ProtonMail me or Private Message me).`}</Alert>
                <Paragraph>{c('Info').t`@pm.me is activated on your account.`}</Paragraph>
                <Link to="/settings/addresses">{c('Link').t`Add another address`}</Link>
            </>
        );
    }

    return (
        <Alert>{c('Info')
            .t`You can now also receive messages at your @pm.me address (short for ProtonMail me or Private Message me). Upgrade to a paid account to also send emails from your @pm.me address.`}</Alert>
    );
};

export default PmMePanel;
