import { c } from 'ttag';

import { ButtonLike, Href } from '@proton/atoms';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { SECURITY_CHECKUP_PATHS } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';
import SecurityCheckupCohort from '@proton/shared/lib/interfaces/securityCheckup/SecurityCheckupCohort';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import type { IconName } from '../../components';
import { AppLink, Icon, Loader, SubTitle } from '../../components';
import {
    useHasOutdatedRecoveryFile,
    useIsDataRecoveryAvailable,
    useIsMnemonicAvailable,
    useIsSecurityCheckupAvailable,
    useIsSentinelUser,
    useRecoverySecrets,
    useRecoveryStatus,
    useSecurityCheckup,
    useUser,
    useUserSettings,
} from '../../hooks';
import { useIsRecoveryFileAvailable } from '../../hooks/recoveryFile';
import { SettingsSectionTitle } from '../account';
import type { RecoveryCardStatusProps } from './RecoveryCardStatus';
import RecoveryCardStatus from './RecoveryCardStatus';
import getSentinelRecoveryProps from './getSentinelRecoveryProps';

interface SentinelUserRecoveryCardProps {
    ids: {
        account: string;
        data: string;
    };
    canDisplayNewSentinelSettings?: boolean;
    isSentinelUser: boolean;
}

const SentinelUserRecoveryCard = ({
    ids,
    canDisplayNewSentinelSettings,
    isSentinelUser,
}: SentinelUserRecoveryCardProps) => {
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

    const hasMnemonic = isMnemonicAvailable && user.MnemonicStatus === MNEMONIC_STATUS.SET;

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

    const sentinelAccountProps: RecoveryCardStatusProps = (() => {
        if (user.MnemonicStatus === MNEMONIC_STATUS.OUTDATED) {
            return {
                type: 'danger',
                statusText: c('Info').t`Outdated recovery phrase; update to ensure access to your data`,
                callToActions: [
                    {
                        text: c('Info').t`Update recovery phrase`,
                        path: `/recovery#${ids.data}`,
                    },
                ],
            };
        }

        return getSentinelRecoveryProps(userSettings.Email, userSettings.Phone, hasMnemonic, ids);
    })();

    const accountStatusProps: RecoveryCardStatusProps | undefined = (() => {
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
        <div className="rounded border p-8 max-w-custom" style={{ '--max-w-custom': '46em' }}>
            <SettingsSectionTitle className="h3">
                {c('Title').t`Take precautions to avoid data loss!`}
            </SettingsSectionTitle>
            <p>
                {isDataRecoveryAvailable
                    ? // translator: Full sentence is 'If you lose your login details and need to reset your account, it’s imperative that you have both an account recovery and data recovery method in place, otherwise you might not be able to access any of your emails, contacts, or files.'
                      c('Info')
                          .jt`If you lose your password and need to reset your account, ${boldImperative} that you have both an ${boldAccountAndRecovery} in place, otherwise you might not be able to access any of your emails, contacts, or files.`
                    : // translator: Full sentence is 'If you lose your login details and need to reset your account, it’s imperative that you have an account recovery method in place.'
                      c('Info')
                          .jt`If you lose your password and need to reset your account, ${boldImperative} that you have an ${boldAccountRecovery} in place.`}
                <br />
                <Href href={getKnowledgeBaseUrl('/set-account-recovery-methods')}>
                    {c('Link').t`Why set recovery methods?`}
                </Href>
            </p>

            <h3 className="text-bold text-rg mb-4">{c('Title').t`Your recovery status`}</h3>

            <ul className="unstyled m-0">
                {canDisplayNewSentinelSettings && isSentinelUser ? (
                    <li>
                        <RecoveryCardStatus {...sentinelAccountProps} />
                    </li>
                ) : (
                    <>
                        {accountStatusProps && (
                            <li>
                                <RecoveryCardStatus {...accountStatusProps} />
                            </li>
                        )}
                        {dataStatusProps && (
                            <li className="mt-2">
                                <RecoveryCardStatus {...dataStatusProps} />
                            </li>
                        )}
                    </>
                )}
            </ul>
        </div>
    );
};

const GenericSecurityCheckupCard = ({
    title,
    subtitle,
    icon,
    color,
    description,
    cta,
}: {
    title: string;
    subtitle: string;
    icon: IconName;
    color: 'success' | 'danger' | 'info' | 'warning';
    description?: string | ReturnType<typeof getBoldFormattedText>;
    cta: string;
}) => {
    return (
        <div className="rounded border max-w-custom p-8 flex flex-column gap-8" style={{ '--max-w-custom': '46em' }}>
            <div className="flex flex-nowrap items-center gap-4">
                <div className={clsx('rounded p-2 overflow-hidden', `security-checkup-color--${color}`)}>
                    <Icon name={icon} size={10} />
                </div>
                <div>
                    <SubTitle className="h3 text-bold mb-0">{title}</SubTitle>
                    <div className="color-weak max-w-custom">{subtitle}</div>
                </div>
            </div>

            <div>{description}</div>

            <ButtonLike
                className="self-start"
                as={AppLink}
                to={`${SECURITY_CHECKUP_PATHS.ROOT}?back=${encodeURIComponent(window.location.href)}`}
                color="norm"
            >
                {cta}
            </ButtonLike>
        </div>
    );
};

const SecurityCheckupCard = () => {
    const securityCheckup = useSecurityCheckup();

    const { actions, furtherActions, cohort } = securityCheckup;

    if (cohort === SecurityCheckupCohort.COMPLETE_RECOVERY_MULTIPLE) {
        return (
            <GenericSecurityCheckupCard
                title={c('Safety review').t`Your account and data can be recovered`}
                subtitle={c('Safety review').t`Your account is fully secure.`}
                icon="pass-shield-ok"
                color="success"
                description={c('Safety review')
                    .t`Your account and data can be recovered. Check if you can still access your recovery methods.`}
                cta={c('Safety review').t`Check account security`}
            />
        );
    }

    if (cohort === SecurityCheckupCohort.COMPLETE_RECOVERY_SINGLE) {
        return (
            <GenericSecurityCheckupCard
                title={c('Safety review').t`Safeguard your account`}
                subtitle={c('Safety review').t`You have recommended actions.`}
                icon="pass-shield-warning"
                color="info"
                description={c('Safety review')
                    .t`Your account and data can be recovered. You have recommended actions to Safeguard your account further.`}
                cta={c('Safety review').t`Safeguard account now`}
            />
        );
    }

    if (cohort === SecurityCheckupCohort.ACCOUNT_RECOVERY_ENABLED) {
        return (
            <GenericSecurityCheckupCard
                title={c('Safety review').t`Safeguard your account`}
                subtitle={c('Safety review').t`You are at risk of losing access to your data.`}
                icon="pass-shield-warning"
                color="warning"
                description={getBoldFormattedText(
                    c('Safety review')
                        .t`If you lose your login details and need to reset your account, **it’s imperative** that you have both an **account recovery and data recovery method** in place, otherwise you might not be able to access any of your emails, contacts, files or passwords.`
                )}
                cta={c('Safety review').t`Safeguard account now`}
            />
        );
    }

    if (cohort === SecurityCheckupCohort.NO_RECOVERY_METHOD) {
        return (
            <GenericSecurityCheckupCard
                title={c('Safety review').t`Safeguard your account`}
                subtitle={c('Safety review').t`You are at risk of losing access to your account and data.`}
                icon="pass-shield-warning"
                color="danger"
                description={getBoldFormattedText(
                    c('Safety review')
                        .t`If you lose your login details and need to reset your account, **it’s imperative** that you have both an **account recovery and data recovery method** in place, otherwise you might not be able to access any of your emails, contacts, files or passwords.`
                )}
                cta={c('Safety review').t`Safeguard account now`}
            />
        );
    }

    if (actions.length || furtherActions.length) {
        return (
            <GenericSecurityCheckupCard
                title={c('Safety review').t`Safeguard your account`}
                subtitle={c('Safety review').t`You have recommended actions.`}
                icon="pass-shield-warning"
                color="info"
                cta={c('Safety review').t`Safeguard account now`}
            />
        );
    }

    return (
        <GenericSecurityCheckupCard
            title={c('Safety review').t`Safeguard your account`}
            subtitle={c('Safety review').t`Your account is fully secure.`}
            icon="pass-shield-ok"
            color="success"
            cta={c('Safety review').t`Check account security`}
        />
    );
};

interface RecoveryCardProps {
    ids: {
        account: string;
        data: string;
    };
    canDisplayNewSentinelSettings?: boolean;
}

const RecoveryCard = ({ ids, canDisplayNewSentinelSettings }: RecoveryCardProps) => {
    const [{ isSentinelUser }, loadingIsSentinelUser] = useIsSentinelUser();
    const isSecurityCheckupAvailable = useIsSecurityCheckupAvailable();

    if (loadingIsSentinelUser) {
        return <Loader />;
    }

    if (isSentinelUser || !isSecurityCheckupAvailable) {
        return (
            <SentinelUserRecoveryCard
                ids={ids}
                canDisplayNewSentinelSettings={canDisplayNewSentinelSettings}
                isSentinelUser={isSentinelUser}
            />
        );
    }

    return <SecurityCheckupCard />;
};

export default RecoveryCard;
