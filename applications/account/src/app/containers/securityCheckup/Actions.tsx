import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { useSecurityCheckup } from '@proton/components';
import FormattedPhoneValue from '@proton/components/components/v2/phone/LazyFormattedPhoneValue';
import { SECURITY_CHECKUP_PATHS } from '@proton/shared/lib/constants';
import {
    getIsPerfectEmailState,
    getIsPerfectPhoneState,
    getIsPerfectPhraseState,
} from '@proton/shared/lib/helpers/securityCheckup';
import type { SecurityCheckupAction } from '@proton/shared/lib/interfaces/securityCheckup';

import { SentinelBadge } from './SentinelBadge';
import SecurityCheckupCardButton, { SecurityCheckupCardButtonInner } from './components/SecurityCheckupCardButton';
import SecurityCheckupMainIcon from './components/SecurityCheckupMainIcon';
import { deviceIcon, emailIcon, phoneIcon, phraseIcon } from './methodIcons';

const PhraseAction = () => {
    const { securityState } = useSecurityCheckup();
    const { phrase } = securityState;
    const isPerfectPhraseState = getIsPerfectPhraseState(securityState);

    const history = useHistory();

    if (!phrase.isAvailable || isPerfectPhraseState) {
        return;
    }

    if (phrase.isOutdated) {
        return (
            <SecurityCheckupCardButton onClick={() => history.push(SECURITY_CHECKUP_PATHS.SET_PHRASE)}>
                <SecurityCheckupCardButtonInner
                    prefix={<SecurityCheckupMainIcon className="self-start" icon={phraseIcon} color="warning" />}
                    title={c('Safety review').t`Update your Recovery Kit`}
                    subTitle={c('Safety review').t`to recover your account and data if you're ever locked out`}
                />
            </SecurityCheckupCardButton>
        );
    }

    return (
        <SecurityCheckupCardButton onClick={() => history.push(SECURITY_CHECKUP_PATHS.SET_PHRASE)}>
            <SecurityCheckupCardButtonInner
                prefix={<SecurityCheckupMainIcon className="self-start" icon={phraseIcon} color="danger" />}
                title={c('Safety review').t`Download your Recovery Kit`}
                subTitle={c('Safety review').t`to recover your account and data if you're ever locked out`}
            />
        </SecurityCheckupCardButton>
    );
};

const SetEmailAction = () => {
    const { securityState } = useSecurityCheckup();
    const { email } = securityState;
    const isPerfectEmailState = getIsPerfectEmailState(securityState);

    const history = useHistory();

    if (isPerfectEmailState) {
        return;
    }

    if (!email.value) {
        return (
            <SecurityCheckupCardButton onClick={() => history.push(SECURITY_CHECKUP_PATHS.SET_EMAIL)}>
                <SecurityCheckupCardButtonInner
                    prefix={<SecurityCheckupMainIcon className="self-start" icon={emailIcon} color="danger" />}
                    title={c('Safety review').t`Add a recovery email address`}
                    subTitle={c('Safety review').t`to recover your account if you're ever locked out`}
                />
            </SecurityCheckupCardButton>
        );
    }

    if (!email.isEnabled) {
        return (
            <SecurityCheckupCardButton onClick={() => history.push(SECURITY_CHECKUP_PATHS.ENABLE_EMAIL)}>
                <SecurityCheckupCardButtonInner
                    prefix={<SecurityCheckupMainIcon className="self-start" icon={emailIcon} color="danger" />}
                    title={c('Safety review').t`Enable recovery by email`}
                    subTitle={email.value}
                />
            </SecurityCheckupCardButton>
        );
    }

    if (!email.verified) {
        return (
            <SecurityCheckupCardButton onClick={() => history.push(SECURITY_CHECKUP_PATHS.VERIFY_EMAIL)}>
                <SecurityCheckupCardButtonInner
                    prefix={<SecurityCheckupMainIcon className="self-start" icon={emailIcon} color="warning" />}
                    title={c('Safety review').t`Verify your recovery email address`}
                    subTitle={email.value}
                />
            </SecurityCheckupCardButton>
        );
    }

    return null;
};

const SentinelEmailRecoveryAction = () => {
    const { securityState } = useSecurityCheckup();
    const { email } = securityState;

    const history = useHistory();

    if (!email.value) {
        return (
            <SecurityCheckupCardButton onClick={() => history.push(SECURITY_CHECKUP_PATHS.SET_EMAIL)}>
                <SecurityCheckupCardButtonInner
                    prefix={<SecurityCheckupMainIcon className="self-start" icon={emailIcon} color="warning" />}
                    title={
                        <div className="flex items-center gap-3">
                            {c('Safety review').t`Add an alternative email address`} <SentinelBadge />
                        </div>
                    }
                    subTitle={c('Safety review').t`in case we need to contact you`}
                />
            </SecurityCheckupCardButton>
        );
    }

    if (email.isEnabled) {
        return (
            <SecurityCheckupCardButton onClick={() => history.push(SECURITY_CHECKUP_PATHS.DISABLE_EMAIL)}>
                <SecurityCheckupCardButtonInner
                    prefix={<SecurityCheckupMainIcon className="self-start" icon={emailIcon} color="danger" />}
                    title={
                        <div className="flex items-center gap-3">
                            {c('Safety review').t`Disable recovery by email`} <SentinelBadge />
                        </div>
                    }
                    subTitle={c('Safety review').t`to prevent attackers from taking over your account`}
                />
            </SecurityCheckupCardButton>
        );
    }

    if (!email.verified) {
        return (
            <SecurityCheckupCardButton onClick={() => history.push(SECURITY_CHECKUP_PATHS.VERIFY_EMAIL)}>
                <SecurityCheckupCardButtonInner
                    prefix={<SecurityCheckupMainIcon className="self-start" icon={emailIcon} color="warning" />}
                    title={c('Safety review').t`Verify your email address`}
                    subTitle={email.value}
                />
            </SecurityCheckupCardButton>
        );
    }

    return null;
};

const SetPhoneAction = () => {
    const { securityState } = useSecurityCheckup();
    const { phone } = securityState;
    const isPerfectPhoneState = getIsPerfectPhoneState(securityState);

    const history = useHistory();

    if (isPerfectPhoneState) {
        return;
    }

    if (!phone.value) {
        return (
            <SecurityCheckupCardButton onClick={() => history.push(SECURITY_CHECKUP_PATHS.SET_PHONE)}>
                <SecurityCheckupCardButtonInner
                    prefix={<SecurityCheckupMainIcon className="self-start" icon={phoneIcon} color="danger" />}
                    title={c('Safety review').t`Add a recovery phone number`}
                    subTitle={c('Safety review').t`to recover your account if you're ever locked out`}
                />
            </SecurityCheckupCardButton>
        );
    }

    const formattedPhoneNumber = <FormattedPhoneValue value={phone.value} />;

    if (!phone.isEnabled) {
        return (
            <SecurityCheckupCardButton onClick={() => history.push(SECURITY_CHECKUP_PATHS.ENABLE_PHONE)}>
                <SecurityCheckupCardButtonInner
                    prefix={<SecurityCheckupMainIcon className="self-start" icon={phoneIcon} color="danger" />}
                    title={c('Safety review').t`Enable recovery by phone`}
                    subTitle={formattedPhoneNumber}
                />
            </SecurityCheckupCardButton>
        );
    }

    if (!phone.verified) {
        return (
            <SecurityCheckupCardButton onClick={() => history.push(SECURITY_CHECKUP_PATHS.VERIFY_PHONE)}>
                <SecurityCheckupCardButtonInner
                    prefix={<SecurityCheckupMainIcon className="self-start" icon={phoneIcon} color="warning" />}
                    title={c('Safety review').t`Verify your recovery phone number`}
                    subTitle={formattedPhoneNumber}
                />
            </SecurityCheckupCardButton>
        );
    }

    return null;
};

const SentinelPhoneRecoveryAction = () => {
    const { securityState } = useSecurityCheckup();
    const { phone } = securityState;

    const history = useHistory();

    if (!phone.value) {
        return (
            <SecurityCheckupCardButton onClick={() => history.push(SECURITY_CHECKUP_PATHS.SET_PHONE)}>
                <SecurityCheckupCardButtonInner
                    prefix={<SecurityCheckupMainIcon className="self-start" icon={phoneIcon} color="danger" />}
                    title={
                        <div className="flex items-center gap-3">
                            {c('Safety review').t`Add a phone number`} <SentinelBadge />
                        </div>
                    }
                    subTitle={c('Safety review').t`in case we need to contact you`}
                />
            </SecurityCheckupCardButton>
        );
    }

    if (phone.isEnabled) {
        return (
            <SecurityCheckupCardButton onClick={() => history.push(SECURITY_CHECKUP_PATHS.DISABLE_PHONE)}>
                <SecurityCheckupCardButtonInner
                    prefix={<SecurityCheckupMainIcon className="self-start" icon={phoneIcon} color="danger" />}
                    title={
                        <div className="flex items-center gap-3">
                            {c('Safety review').t`Disable recovery by phone`} <SentinelBadge />
                        </div>
                    }
                    subTitle={c('Safety review').t`to prevent attackers from taking over your account`}
                />
            </SecurityCheckupCardButton>
        );
    }

    const formattedPhoneNumber = <FormattedPhoneValue value={phone.value} />;

    if (!phone.verified) {
        return (
            <SecurityCheckupCardButton onClick={() => history.push(SECURITY_CHECKUP_PATHS.VERIFY_PHONE)}>
                <SecurityCheckupCardButtonInner
                    prefix={<SecurityCheckupMainIcon className="self-start" icon={phoneIcon} color="warning" />}
                    title={c('Safety review').t`Verify your phone number`}
                    subTitle={formattedPhoneNumber}
                />
            </SecurityCheckupCardButton>
        );
    }

    return null;
};

const DeviceAction = () => {
    const { securityState } = useSecurityCheckup();
    const { deviceRecovery } = securityState;

    const history = useHistory();

    if (!deviceRecovery.isAvailable || deviceRecovery.isEnabled) {
        return;
    }

    return (
        <SecurityCheckupCardButton onClick={() => history.push(SECURITY_CHECKUP_PATHS.ENABLE_DEVICE_RECOVERY)}>
            <SecurityCheckupCardButtonInner
                prefix={<SecurityCheckupMainIcon className="self-start" icon={deviceIcon} color="danger" />}
                title={c('Safety review').t`Enable device-based recovery`}
                subTitle={c('Safety review').t`to automatically recover your data when you log into a trusted device`}
            />
        </SecurityCheckupCardButton>
    );
};

const Actions = ({ actions }: { actions: SecurityCheckupAction[] }) => {
    if (!actions.length) {
        return;
    }

    return (
        <div className="security-checkup-card-container">
            {actions.map((action) => {
                if (action === 'phrase') {
                    return <PhraseAction key="phrase-action" />;
                }

                if (action === 'set-email') {
                    return <SetEmailAction key="email-action" />;
                }
                if (action === 'sentinel-email') {
                    return <SentinelEmailRecoveryAction key="email-action" />;
                }

                if (action === 'set-phone') {
                    return <SetPhoneAction key="phone-action" />;
                }

                if (action === 'sentinel-phone') {
                    return <SentinelPhoneRecoveryAction key="phone-action" />;
                }

                if (action === 'device') {
                    return <DeviceAction key="device-action" />;
                }
            })}
        </div>
    );
};

export default Actions;
