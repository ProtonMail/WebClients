import React from 'react';
import { c } from 'ttag';
import { ADDRESS_TYPE } from 'proton-shared/lib/constants';
import { Alert, Loader } from '../../components';
import { useUser, useAddresses } from '../../hooks';

import PmMeButton from './PmMeButton';

const PmMePanel = () => {
    const [{ canPay, hasPaidMail }] = useUser();
    const [addresses, loading] = useAddresses();

    if (loading && !Array.isArray(addresses)) {
        return <Loader />;
    }

    if (canPay) {
        const hasPremium = addresses.some(({ Type }) => Type === ADDRESS_TYPE.TYPE_PREMIUM);

        if (!hasPremium) {
            if (hasPaidMail) {
                return (
                    <>
                        <Alert learnMore="https://protonmail.com/support/knowledge-base/pm-me-addresses/">{c('Info')
                            .t`ProtonMail supports @pm.me email addresses (short for ProtonMail me or Private Message me). Once activated, you can send and receive emails using your @pm.me address and create additional @pm.me addresses by navigating to the addresses section.`}</Alert>
                        <PmMeButton />
                    </>
                );
            }

            return (
                <>
                    <Alert learnMore="https://protonmail.com/support/knowledge-base/pm-me-addresses/">{c('Info')
                        .t`ProtonMail supports @pm.me email addresses (short for ProtonMail me or Private Message me). Once activated, you can receive emails to your @pm.me address. Upgrade to a paid plan to also send emails using your @pm.me address and create additional @pm.me addresses.`}</Alert>
                    <PmMeButton />
                </>
            );
        }

        if (hasPaidMail) {
            return (
                <>
                    <Alert learnMore="https://protonmail.com/support/knowledge-base/pm-me-addresses/">{c('Info')
                        .t`ProtonMail supports @pm.me email addresses (short for ProtonMail me or Private Message me). You can now send and receive emails using your @pm.me address and create additional @pm.me addresses by navigating to the addresses section.`}</Alert>
                    <Alert type="success">{c('Info').t`The short domain @pm.me is active on your account.`}</Alert>
                </>
            );
        }

        return (
            <>
                <Alert learnMore="https://protonmail.com/support/knowledge-base/pm-me-addresses/">{c('Info')
                    .t`You can now receive messages from your @pm.me address (short for ProtonMail me or Private Message me). Upgrade to a paid plan to also send emails using your @pm.me address and create additional @pm.me addresses.`}</Alert>
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
