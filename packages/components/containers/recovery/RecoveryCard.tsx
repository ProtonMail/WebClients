import { c } from 'ttag';
import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { Card, LearnMore, Loader } from '../../components';
import {
    useHasOutdatedRecoveryFile,
    useIsDataRecoveryAvailable,
    useIsMnemonicAvailable,
    useRecoverySecrets,
    useRecoveryStatus,
    useUser,
    useUserSettings,
} from '../../hooks';
import { SettingsSectionTitle } from '../account';
import useIsRecoveryFileAvailable from '../../hooks/useIsRecoveryFileAvailable';
import RecoveryCardStatus, { RecoveryCardStatusProps } from './RecoveryCardStatus';

interface Props {
    ids: {
        account: string;
        data: string;
    };
}

const RecoveryCard = ({ ids }: Props) => {
    const [user] = useUser();
    const [userSettings, loadingUserSettings] = useUserSettings();
    const [{ accountRecoveryStatus, dataRecoveryStatus }, loadingRecoveryStatus] = useRecoveryStatus();

    const [isRecoveryFileAvailable, loadingIsRecoveryFileAvailable] = useIsRecoveryFileAvailable();
    const [isMnemonicAvailable, loadingIsMnemonicAvailable] = useIsMnemonicAvailable();
    const [isDataRecoveryAvailable, loadingIsDataRecoveryAvailable] = useIsDataRecoveryAvailable();

    const hasOutdatedRecoveryFile = useHasOutdatedRecoveryFile();
    const recoverySecrets = useRecoverySecrets();

    if (
        loadingRecoveryStatus ||
        loadingIsDataRecoveryAvailable ||
        loadingIsRecoveryFileAvailable ||
        loadingIsMnemonicAvailable ||
        loadingUserSettings
    ) {
        return <Loader />;
    }

    const boldImperative = (
        <b key="imperative-bold-text">{
            // translator: Full sentence is 'If you lose your login details and need to reset your account, it’s imperative that you have both an account recovery and data recovery method in place, otherwise you might not be able to access any of your emails, contacts, or files.'
            c('Info').t`it’s imperative`
        }</b>
    );

    const boldAccountAndRecovery = (
        <b key="account-and-recovery-bold-text">{
            // translator: Full sentence is 'If you lose your login details and need to reset your account, it’s imperative that you have both an account recovery and data recovery method in place, otherwise you might not be able to access any of your emails, contacts, or files.'
            c('Info').t`account recovery and data recovery method`
        }</b>
    );

    const boldAccountRecovery = (
        <b key="account-recovery-bold-text">{
            // translator: Full sentence is 'If you lose your login details and need to reset your account, it’s imperative that you have an account recovery method in place.'
            c('Info').t`account recovery method`
        }</b>
    );

    const accountStatusProps: RecoveryCardStatusProps = (() => {
        if (accountRecoveryStatus === 'complete') {
            return {
                type: 'success',
                statusText: c('Info').t`Your account recovery method is set`,
                callToActions: [],
            };
        }

        const emailCTA = {
            text:
                !!userSettings.Email.Value && !userSettings.Email.Reset
                    ? c('Info').t`Allow recovery by email`
                    : c('Info').t`Add a recovery email address`,
            path: `/recovery#${ids.account}`,
        };

        const phoneCTA = {
            text:
                !!userSettings.Phone.Value && !userSettings.Phone.Reset
                    ? c('Info').t`Allow recovery by phone`
                    : c('Info').t`Add a recovery phone number`,
            path: `/recovery#${ids.account}`,
        };

        if (user.MnemonicStatus === MNEMONIC_STATUS.SET) {
            return {
                type: 'info',
                statusText: c('Info').t`To ensure continuous access to your account, set an account recovery method`,
                callToActions: [emailCTA, phoneCTA],
            };
        }

        return {
            type: 'warning',
            statusText: c('Info').t`No account recovery method set; you are at risk of losing access to your account`,
            callToActions: [emailCTA, phoneCTA],
        };
    })();

    const dataStatusProps: RecoveryCardStatusProps | undefined = (() => {
        if (!isRecoveryFileAvailable && !isMnemonicAvailable) {
            return;
        }

        const recoveryFileCTA = isRecoveryFileAvailable && {
            text: c('Info').t`Download recovery file`,
            path: `/recovery#${ids.data}`,
        };

        const updateRecoveryFileCTA = isRecoveryFileAvailable && {
            text: c('Info').t`Update recovery file`,
            path: `/recovery#${ids.data}`,
        };

        const recoveryPhraseCTA = isMnemonicAvailable && {
            text: c('Info').t`Set recovery phrase`,
            path: `/recovery#${ids.data}`,
        };

        const updateRecoveryPhraseCTA = isMnemonicAvailable && {
            text: c('Info').t`Update recovery phrase`,
            path: `/recovery#${ids.data}`,
        };

        if (user.MnemonicStatus === MNEMONIC_STATUS.OUTDATED && hasOutdatedRecoveryFile) {
            return {
                type: 'danger',
                statusText: c('Info').t`Outdated recovery methods; update to ensure access to your data`,
                callToActions: [updateRecoveryPhraseCTA, updateRecoveryFileCTA].filter(isTruthy),
            };
        }

        if (user.MnemonicStatus === MNEMONIC_STATUS.OUTDATED) {
            return {
                type: 'danger',
                statusText: c('Info').t`Outdated recovery phrase; update to ensure access to your data`,
                callToActions: [updateRecoveryPhraseCTA, recoverySecrets.length === 0 && recoveryFileCTA].filter(
                    isTruthy
                ),
            };
        }

        if (hasOutdatedRecoveryFile) {
            return {
                type: 'danger',
                statusText: c('Info').t`Outdated recovery file; update to ensure access to your data`,
                callToActions: [
                    user.MnemonicStatus !== MNEMONIC_STATUS.SET && recoveryPhraseCTA,
                    updateRecoveryFileCTA,
                ].filter(isTruthy),
            };
        }

        if (dataRecoveryStatus === 'complete') {
            return {
                type: 'success',
                statusText: c('Info').t`Your data recovery method is set`,
                callToActions: [],
            };
        }

        return {
            type: 'warning',
            statusText: c('Info').t`No data recovery method set; you are at risk of losing access to your data`,
            callToActions: [recoveryPhraseCTA, recoveryFileCTA].filter(isTruthy),
        };
    })();

    return (
        <Card rounded background={false} className="max-w52e p2">
            <SettingsSectionTitle className="h3">{c('Title')
                .t`Take precautions to avoid data loss!`}</SettingsSectionTitle>
            <p>
                {isDataRecoveryAvailable
                    ? // translator: Full sentence is 'If you lose your login details and need to reset your account, it’s imperative that you have both an account recovery and data recovery method in place, otherwise you might not be able to access any of your emails, contacts, or files.'
                      c('Info')
                          .jt`If you lose your login details and need to reset your account, ${boldImperative} that you have both an ${boldAccountAndRecovery} in place, otherwise you might not be able to access any of your emails, contacts, or files.`
                    : // translator: Full sentence is 'If you lose your login details and need to reset your account, it’s imperative that you have an account recovery method in place.'
                      c('Info')
                          .jt`If you lose your login details and need to reset your account, ${boldImperative} that you have an ${boldAccountRecovery} in place.`}
                <br />
                <LearnMore url="https://protonmail.com/support/knowledge-base/set-account-recovery-methods" />
            </p>

            <h3 className="text-bold text-rg mb1">{c('Title').t`Your recovery status`}</h3>

            <ul className="unstyled m0">
                <li>
                    <RecoveryCardStatus {...accountStatusProps} />
                </li>

                {dataStatusProps && (
                    <li className="mt0-5">
                        <RecoveryCardStatus {...dataStatusProps} />
                    </li>
                )}
            </ul>
        </Card>
    );
};

export default RecoveryCard;
