import { type ChangeEvent, useRef, useState } from 'react';

import { c } from 'ttag';

import { RecoveryMethodWarningModal } from '@proton/account/delegatedAccess/recoveryContact/RecoveryMethodWarningModal';
import { selectAccountRecovery } from '@proton/account/recovery/accountRecovery';
import {
    toggleRecoveryEmailReset,
    toggleRecoveryPhoneReset,
    updateRecoveryEmailValue,
    updateRecoveryPhoneValue,
} from '@proton/account/recovery/accountRecoveryActions';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import AuthModal, { type AuthModalResult } from '@proton/components/containers/password/AuthModal';
import ConfirmRemoveEmailModal from '@proton/components/containers/recovery/email/ConfirmRemoveEmailModal';
import VerifyRecoveryEmailModal from '@proton/components/containers/recovery/email/VerifyRecoveryEmailModal';
import ConfirmRemovePhoneModal from '@proton/components/containers/recovery/phone/ConfirmRemovePhoneModal';
import VerifyRecoveryPhoneModal from '@proton/components/containers/recovery/phone/VerifyRecoveryPhoneModal';
import { useRecoverySettingsTelemetry } from '@proton/components/containers/recovery/recoverySettingsTelemetry';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch, useSelector } from '@proton/redux-shared-store/sharedProvider';
import { unlockPasswordChanges } from '@proton/shared/lib/api/user';
import { SETTINGS_STATUS, type UserSettings } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

export const useUpdateAccountRecovery = () => {
    const { sendRecoverySettingEnabled } = useRecoverySettingsTelemetry();
    const { createNotification } = useNotifications();

    const dispatch = useDispatch();
    const accountRecoveryData = useSelector(selectAccountRecovery);

    const [authModal, showAuthModal] = useModalTwoPromise<undefined, AuthModalResult>();
    const [renderProps, showRecoveryContactWarning, renderModal] = useModalState();

    const [verifyRecoveryEmailModal, setVerifyRecoveryEmailModalOpen, renderVerifyRecoveryEmailModal] = useModalState();
    const [verifyRecoveryEmailProps, setVerifyRecoveryEmailProps] = useState<{ email: string } | null>(null);
    const [confirmRecoveryEmailProps, setConfirmRecoveryEmailModal, renderConfirmRecoveryEmailProps] = useModalState();
    const isSubmittingEmailRef = useRef(false);

    const [verifyRecoveryPhoneModal, setVerifyRecoveryPhoneModalOpen, renderVerifyRecoveryPhoneModal] = useModalState();
    const [confirmRecoveryPhoneProps, setConfirmRecoveryPhoneModal, renderConfirmRecoveryPhoneProps] = useModalState();
    const isSubmittingPhoneRef = useRef(false);
    const [loadingPhone, withLoadingPhone] = useLoading(false);
    const [loadingEmail, withLoadingEmail] = useLoading(false);
    const [loadingPhoneReset, withLoadingPhoneReset] = useLoading();
    const [loadingEmailReset, withLoadingEmailReset] = useLoading();

    const handleChangeEmailValue = async ({
        value: nextEmail,
        autoStartVerificationFlowAfterSet = false,
        persistPasswordScope = false,
        ignoreConfirm = false,
    }: {
        value: string;
        autoStartVerificationFlowAfterSet?: boolean;
        persistPasswordScope?: boolean;
        ignoreConfirm?: boolean;
    }): Promise<UserSettings | undefined> => {
        const update = async () => {
            const userSettings = await dispatch(updateRecoveryEmailValue({ value: nextEmail, persistPasswordScope }));
            createNotification({ text: c('Success').t`Email updated` });

            if (
                autoStartVerificationFlowAfterSet &&
                nextEmail &&
                nextEmail !== accountRecoveryData.emailRecovery.value &&
                userSettings.Email.Status !== SETTINGS_STATUS.VERIFIED
            ) {
                setVerifyRecoveryEmailProps({ email: nextEmail });
                setVerifyRecoveryEmailModalOpen(true);
            }

            const emailEnabled = !!userSettings.Email.Reset && !!userSettings.Email.Value;

            if (emailEnabled) {
                sendRecoverySettingEnabled({ setting: 'recovery_by_email' });
            }

            return userSettings;
        };
        if (!nextEmail && !accountRecoveryData.emailRecovery.canDisable) {
            showRecoveryContactWarning(true);
            return;
        }
        if (
            !ignoreConfirm &&
            !nextEmail &&
            (accountRecoveryData.emailRecovery.hasReset || accountRecoveryData.emailRecovery.hasNotify)
        ) {
            setConfirmRecoveryEmailModal(true);
            return;
        }
        if (isSubmittingEmailRef.current) {
            return;
        }
        isSubmittingEmailRef.current = true;

        const promise = update()
            .catch(noop)
            .finally(() => {
                isSubmittingEmailRef.current = false;
            });
        withLoadingEmail(promise).catch(noop);
        return promise;
    };

    const handleChangePhoneValue = async ({
        value: nextPhone,
        autoStartVerificationFlowAfterSet = false,
        persistPasswordScope = false,
        ignoreConfirm = false,
    }: {
        value: string;
        autoStartVerificationFlowAfterSet?: boolean;
        persistPasswordScope?: boolean;
        ignoreConfirm?: boolean;
    }) => {
        const update = async () => {
            const userSettings = await dispatch(updateRecoveryPhoneValue({ value: nextPhone, persistPasswordScope }));
            createNotification({ text: c('Success').t`Phone number updated` });

            if (
                autoStartVerificationFlowAfterSet &&
                nextPhone &&
                nextPhone !== accountRecoveryData.phoneRecovery.value &&
                userSettings.Phone.Status !== SETTINGS_STATUS.VERIFIED
            ) {
                setVerifyRecoveryPhoneModalOpen(true);
            }

            const phoneEnabled = !!userSettings.Phone.Reset && !!userSettings.Phone.Value;
            if (phoneEnabled) {
                sendRecoverySettingEnabled({ setting: 'recovery_by_phone' });
            }

            return userSettings;
        };

        if (!nextPhone && !accountRecoveryData.phoneRecovery.canDisable) {
            showRecoveryContactWarning(true);
            return;
        }
        if (!ignoreConfirm && !nextPhone && accountRecoveryData.phoneRecovery.hasReset) {
            setConfirmRecoveryPhoneModal(true);
            return;
        }
        if (isSubmittingPhoneRef.current) {
            return;
        }
        isSubmittingPhoneRef.current = true;
        const promise = update()
            .catch(noop)
            .finally(() => {
                isSubmittingPhoneRef.current = false;
            });
        withLoadingPhone(promise).catch(noop);
        return promise;
    };

    const handleChangePasswordEmailToggle = async (value: number) => {
        const update = async () => {
            if (value && !accountRecoveryData.emailRecovery.value) {
                return createNotification({
                    type: 'error',
                    text: c('Error').t`Please set a recovery email first`,
                });
            }
            await showAuthModal(); // TODO: Do we really need a client side triggered auth modal?
            await dispatch(toggleRecoveryEmailReset({ value: Boolean(value) }));
            if (value) {
                sendRecoverySettingEnabled({ setting: 'recovery_by_email' });
            }
        };
        if (!value && !accountRecoveryData.emailRecovery.canDisable) {
            showRecoveryContactWarning(true);
            return;
        }
        return update().catch(noop);
    };

    const handleChangePasswordPhoneToggle = async (value: number) => {
        const update = async () => {
            if (value && !accountRecoveryData.phoneRecovery.value) {
                return createNotification({
                    type: 'error',
                    text: c('Error').t`Please set a recovery phone number first`,
                });
            }
            await showAuthModal(); // TODO: Do we really need a client side triggered auth modal?
            await dispatch(toggleRecoveryPhoneReset({ value: Boolean(value) }));
            if (value) {
                sendRecoverySettingEnabled({ setting: 'recovery_by_phone' });
            }
        };
        return update().catch(noop);
    };

    const el = (
        <>
            {renderModal && <RecoveryMethodWarningModal {...renderProps} />}
            {authModal(({ onResolve, onReject, ...props }) => {
                return (
                    <AuthModal
                        {...props}
                        scope="password"
                        config={unlockPasswordChanges()}
                        onCancel={onReject}
                        onSuccess={onResolve}
                    />
                );
            })}
            {renderConfirmRecoveryEmailProps && (
                <ConfirmRemoveEmailModal
                    hasReset={accountRecoveryData.emailRecovery.hasReset}
                    hasNotify={accountRecoveryData.emailRecovery.hasNotify}
                    {...confirmRecoveryEmailProps}
                    onConfirm={() => {
                        return handleChangeEmailValue({ value: '', ignoreConfirm: true });
                    }}
                />
            )}
            {renderVerifyRecoveryEmailModal && (
                <VerifyRecoveryEmailModal
                    email={verifyRecoveryEmailProps?.email ?? accountRecoveryData.emailRecovery.value}
                    {...verifyRecoveryEmailModal}
                />
            )}
            {renderConfirmRecoveryPhoneProps && (
                <ConfirmRemovePhoneModal
                    {...confirmRecoveryPhoneProps}
                    onConfirm={() => {
                        return handleChangePhoneValue({ value: '', ignoreConfirm: true });
                    }}
                />
            )}
            {renderVerifyRecoveryPhoneModal && <VerifyRecoveryPhoneModal {...verifyRecoveryPhoneModal} />}
        </>
    );

    return {
        el,
        data: accountRecoveryData,
        recoveryEmail: {
            handleChangeEmailValue,
            toggleProps: {
                checked: accountRecoveryData.emailRecovery.legacyEnabled,
                onChange: ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => {
                    return withLoadingEmailReset(handleChangePasswordEmailToggle(+checked).catch(noop));
                },
                loading: loadingEmailReset,
            },
            props: {
                emailData: accountRecoveryData.emailRecovery,
                loading: loadingEmail,
                onSubmit: (value: string) => {
                    return handleChangeEmailValue({ value: value });
                },
                onVerify: () => {
                    setVerifyRecoveryEmailModalOpen(true);
                },
            },
        },
        recoveryPhone: {
            handleChangePhoneValue,
            toggleProps: {
                checked: accountRecoveryData.phoneRecovery.legacyEnabled,
                onChange: ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => {
                    return withLoadingPhoneReset(handleChangePasswordPhoneToggle(+checked).catch(noop));
                },
                loading: loadingPhoneReset,
            },
            props: {
                phoneData: accountRecoveryData.phoneRecovery,
                loading: loadingPhone,
                onSubmit: (value: string) => {
                    return handleChangePhoneValue({ value: value });
                },
                onVerify: () => {
                    setVerifyRecoveryPhoneModalOpen(true);
                },
            },
        },
    };
};
