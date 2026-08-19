import { useState } from 'react';

import { c } from 'ttag';

import { useUpdateAccountRecovery } from '@proton/account/recovery/useUpdateAccountRecovery';
import { DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';
import Loader from '@proton/components/components/loader/Loader';
import useMyCountry from '@proton/components/hooks/useMyCountry';

import { RecoveryFieldForm } from '../recovery/RecoveryFieldForm';
import RecoveryEmail from '../recovery/email/RecoveryEmail';
import RecoveryPhone from '../recovery/phone/RecoveryPhone';

const NonPrivateRecoverySection = () => {
    const defaultCountry = useMyCountry();
    const accountRecovery = useUpdateAccountRecovery();
    const [maybeIsEditingEmail, setIsEditingEmail] = useState(false);
    const [maybeIsEditingPhone, setIsEditingPhone] = useState(false);

    const { emailRecovery, phoneRecovery, loading } = accountRecovery.data;

    if (loading) {
        return <Loader />;
    }

    // Handles the case where a user focuses the input and clears the value, gets the confirmation modal, and clicks confirm.
    // The change happens outside of the onSubmit handler, so this is an extra guard against that.
    const isEditingEmail = maybeIsEditingEmail && !!emailRecovery.value;
    const isEditingPhone = maybeIsEditingPhone && !!phoneRecovery.value;

    return (
        <>
            {accountRecovery.el}
            <RecoveryEmail
                disableVerifyCta
                {...accountRecovery.recoveryEmail.props}
                onSubmit={async (value) => {
                    try {
                        await accountRecovery.recoveryEmail.handleChangeEmailValue({
                            value,
                            autoStartVerificationFlowAfterSet: true,
                        });
                        setIsEditingEmail(false);
                    } catch {}
                }}
                inputProps={{
                    label: c('Label').t`Notification email address`,
                    readOnly: !isEditingEmail && !!emailRecovery.value,
                    placeholder: c('Placeholder').t`example@domain.com`,
                    onFocus: () => {
                        if (!emailRecovery.value) {
                            return;
                        }
                        setIsEditingEmail(true);
                    },
                }}
                renderForm={(formProps) => (
                    <RecoveryFieldForm
                        {...formProps}
                        value={emailRecovery.value}
                        isVerified={emailRecovery.isVerified}
                        isEditing={isEditingEmail}
                        onEdit={() => setIsEditingEmail(true)}
                        onKeep={() => {
                            formProps.onReset();
                            setIsEditingEmail(false);
                        }}
                    />
                )}
            />

            <DashboardCardDivider />

            <RecoveryPhone
                defaultCountry={defaultCountry}
                disableVerifyCta
                {...accountRecovery.recoveryPhone.props}
                onSubmit={async (value) => {
                    try {
                        await accountRecovery.recoveryPhone.handleChangePhoneValue({
                            value,
                            autoStartVerificationFlowAfterSet: true,
                        });
                        setIsEditingPhone(false);
                    } catch {}
                }}
                inputProps={{
                    label: c('label').t`Notification phone number`,
                    readOnly: !isEditingPhone && !!phoneRecovery.value,
                    onFocus: () => {
                        if (!phoneRecovery.value) {
                            return;
                        }
                        setIsEditingPhone(true);
                    },
                }}
                renderForm={(formProps) => (
                    <RecoveryFieldForm
                        {...formProps}
                        value={phoneRecovery.value}
                        isVerified={phoneRecovery.isVerified}
                        isEditing={isEditingPhone}
                        onEdit={() => setIsEditingPhone(true)}
                        onKeep={() => {
                            formProps.onReset();
                            setIsEditingPhone(false);
                        }}
                    />
                )}
            />
        </>
    );
};

export default NonPrivateRecoverySection;
