import React from 'react';
import { c } from 'ttag';
import { ADDRESS_TYPE } from 'proton-shared/lib/constants';
import { Alert, Loader, useUser, useAddresses } from 'react-components';

import PmMeButton from './PmMeButton';

const PmMePanel = () => {
    const [user] = useUser();
    const [addresses, loading] = useAddresses();

    if (loading) {
        return <Loader />;
    }

    const hasPremium = addresses.some(({ Type }) => Type === ADDRESS_TYPE.TYPE_PREMIUM);

    if (user.hasPaidMail) {
        if (!hasPremium) {
            return (
                <>
                    <Alert learnMore="https://protonmail.com/support/knowledge-base/pm-me-addresses/">{c('Info')
                        .t`ProtonMail now supports @pm.me email addresses (short for ProtonMail me or Private Message me). Paid users can add other @pm.me addresses.`}</Alert>
                    <PmMeButton />
                </>
            );
        }

        return (
            <>
                <Alert learnMore="https://protonmail.com/support/knowledge-base/pm-me-addresses/">{c('Info')
                    .t`You can now also receive and send messages from your @pm.me address (short for ProtonMail me or Private Message me).`}</Alert>
                <Alert type="success">{c('Info').t`The short domain @pm.me is active on your account.`}</Alert>
            </>
        );
    }

    return (
        <Alert>{c('Info')
            .t`ProtonMail now supports @pm.me email addresses (short for ProtonMail me or Private Message me). Upgrade to a paid account to also send emails from your @pm.me address.`}</Alert>
    );
};

export default PmMePanel;
