import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { Icon, useSecurityCheckup } from '@proton/components';
import FormattedPhoneValue from '@proton/components/components/v2/phone/LazyFormattedPhoneValue';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { SECURITY_CHECKUP_PATHS } from '@proton/shared/lib/constants';
import {
    getIsPerfectDeviceRecoveryState,
    getIsPerfectEmailState,
    getIsPerfectPhoneState,
    getIsPerfectPhraseState,
} from '@proton/shared/lib/helpers/securityCheckup';
import type SecurityState from '@proton/shared/lib/interfaces/securityCheckup/SecurityState';

import { SentinelBadge } from './SentinelBadge';
import SecurityCheckupCard from './components/SecurityCheckupCard';
import SecurityCheckupCardInner from './components/SecurityCheckupCardInner';
import SecurityCheckupMainIcon from './components/SecurityCheckupMainIcon';
import { emailIcon, phoneIcon, phraseIcon } from './methodIcons';

const Phrase = () => {
    const { securityState } = useSecurityCheckup();
    const isPerfectPhraseState = getIsPerfectPhraseState(securityState);

    if (!isPerfectPhraseState) {
        return;
    }

    return (
        <SecurityCheckupCard>
            <SecurityCheckupCardInner
                prefix={<SecurityCheckupMainIcon className="self-start" icon={phraseIcon} color="success" />}
                title={c('Safety review').t`Your Recovery Kit`}
                subTitle={c('Safety review').t`Can be used to regain access to your account and data`}
                checkmark
            />
        </SecurityCheckupCard>
    );
};

const Email = () => {
    const { securityState } = useSecurityCheckup();
    const { email } = securityState;
    const isPerfectEmailState = getIsPerfectEmailState(securityState);

    const isPerfectDeviceState = getIsPerfectDeviceRecoveryState(securityState);

    if (!isPerfectEmailState) {
        return;
    }

    if (securityState.hasSentinelEnabled) {
        const disableEmail = (
            <Link key="enable-device-recovery" to={SECURITY_CHECKUP_PATHS.DISABLE_EMAIL} className="color-weak">
                {
                    // translator: full sentence "Disable recovery by email to increase your account security."
                    c('Safety review').t`Disable recovery by email `
                }
            </Link>
        );
        return (
            <SecurityCheckupCard>
                <SecurityCheckupCardInner
                    prefix={<SecurityCheckupMainIcon className="self-start" icon={emailIcon} color="info" />}
                    title={
                        <>
                            {c('Safety review').t`Your recovery email`} &nbsp;
                            <Icon className="shrink-0 color-danger mb-0.5" size={4} name="exclamation-circle-filled" />
                        </>
                    }
                    subTitle={email.value}
                />
                <div className="px-4 py-3  flex items-center justify-between border-top border-weak">
                    <div className="flex-1 color-weak text-sm">
                        {
                            // translator: full sentence "You recovery email could be abused by attackers to take over your account. Disable recovery by email to increase your account security."
                            c('Safety review')
                                .jt`You recovery email could be abused by attackers to take over your account. ${disableEmail} to increase your account security.`
                        }
                    </div>
                    <SentinelBadge className="ml-4" />
                </div>
            </SecurityCheckupCard>
        );
    }

    return (
        <SecurityCheckupCard>
            <SecurityCheckupCardInner
                prefix={
                    <SecurityCheckupMainIcon
                        className="self-start"
                        icon={emailIcon}
                        color={isPerfectDeviceState ? 'success' : 'info'}
                    />
                }
                title={c('Safety review').t`Your recovery email`}
                subTitle={email.value}
                checkmark={isPerfectDeviceState}
            />
        </SecurityCheckupCard>
    );
};

const Phone = () => {
    const { securityState } = useSecurityCheckup();
    const { phone } = securityState;
    const isPerfectPhoneState = getIsPerfectPhoneState(securityState);

    const isPerfectDeviceState = getIsPerfectDeviceRecoveryState(securityState);

    if (!isPerfectPhoneState || !phone.value) {
        return;
    }

    const formattedPhoneNumber = <FormattedPhoneValue value={phone.value} />;

    if (securityState.hasSentinelEnabled) {
        const disablePhone = (
            <Link key="enable-device-recovery" to={SECURITY_CHECKUP_PATHS.DISABLE_PHONE} className="color-weak">
                {
                    // translator: full sentence "Disable recovery by phone to increase your account security."
                    c('Safety review').t`Disable recovery by phone `
                }
            </Link>
        );
        return (
            <SecurityCheckupCard>
                <SecurityCheckupCardInner
                    prefix={<SecurityCheckupMainIcon className="self-start" icon={phoneIcon} color="info" />}
                    title={
                        <>
                            {c('Safety review').t`Your recovery phone`} &nbsp;
                            <Icon className="shrink-0 color-danger mb-0.5" size={4} name="exclamation-circle-filled" />
                        </>
                    }
                    subTitle={formattedPhoneNumber}
                />
                <div className="px-4 py-3  flex items-center justify-between border-top border-weak">
                    <div className="flex-1 color-weak text-sm">
                        {
                            // translator: full sentence "You recovery phone could be abused by attackers to take over your account. Disable recovery by phone to increase your account security."
                            c('Safety review')
                                .jt`You recovery phone could be abused by attackers to take over your account. ${disablePhone} to increase your account security.`
                        }
                    </div>
                    <SentinelBadge className="ml-4" />
                </div>
            </SecurityCheckupCard>
        );
    }

    return (
        <SecurityCheckupCard>
            <SecurityCheckupCardInner
                prefix={
                    <SecurityCheckupMainIcon
                        className="self-start"
                        icon={phoneIcon}
                        color={isPerfectDeviceState ? 'success' : 'info'}
                    />
                }
                title={c('Safety review').t`Your recovery phone`}
                subTitle={formattedPhoneNumber}
                checkmark={isPerfectDeviceState}
            />
        </SecurityCheckupCard>
    );
};

const Device = () => {
    const { securityState } = useSecurityCheckup();
    const { deviceRecovery } = securityState;

    const isPerfectEmailState = getIsPerfectEmailState(securityState);
    const isPerfectPhoneState = getIsPerfectPhoneState(securityState);

    if (!deviceRecovery.isAvailable) {
        return null;
    }

    if (!deviceRecovery.isEnabled) {
        const disclaimerText = (() => {
            if (isPerfectEmailState && isPerfectPhoneState) {
                return getBoldFormattedText(
                    c('Safety review').t`Your recovery email and phone can **only recover access to your account**.`
                );
            }

            if (isPerfectEmailState) {
                return getBoldFormattedText(
                    c('Safety review').t`Your recovery email can **only recover access to your account**.`
                );
            }

            if (isPerfectPhoneState) {
                return getBoldFormattedText(
                    c('Safety review').t`Your recovery phone can **only recover access to your account**.`
                );
            }
        })();

        const enableDeviceRecovery = (
            // translator: full sentence "Enable device-based recovery to ensure your data can be recovered."
            <Link key="enable-device-recovery" to={SECURITY_CHECKUP_PATHS.ENABLE_DEVICE_RECOVERY}>
                {c('Safety review').t`Enable device-based recovery`}
            </Link>
        );

        return (
            <div className="p-4 text-sm">
                <div>{disclaimerText}</div>
                <div>
                    {
                        // translator: full sentence "Enable device-based recovery to ensure your data can be recovered."
                        c('Safety review').jt`${enableDeviceRecovery} to ensure your data can be recovered.`
                    }
                </div>
            </div>
        );
    }

    return null;
};

export const showRecoveryMethods = (securityState: SecurityState) => {
    const isPerfectPhraseState = getIsPerfectPhraseState(securityState);

    const isPerfectEmailState = getIsPerfectEmailState(securityState);
    const isPerfectPhoneState = getIsPerfectPhoneState(securityState);

    if (isPerfectPhraseState) {
        return true;
    }

    return isPerfectPhraseState || isPerfectEmailState || isPerfectPhoneState;
};

const RecoveryMethods = () => {
    const { securityState } = useSecurityCheckup();

    const isPerfectPhraseState = getIsPerfectPhraseState(securityState);
    const isPerfectEmailState = getIsPerfectEmailState(securityState);
    const isPerfectPhoneState = getIsPerfectPhoneState(securityState);

    return (
        <div className="flex flex-column gap-4">
            {isPerfectPhraseState && (
                <div className="security-checkup-card-container">
                    <Phrase />
                </div>
            )}
            {(isPerfectEmailState || isPerfectPhoneState) && (
                <div className="security-checkup-card-container">
                    {isPerfectEmailState && <Email />}
                    {isPerfectPhoneState && <Phone />}
                    <Device />
                </div>
            )}
        </div>
    );
};

export default RecoveryMethods;
