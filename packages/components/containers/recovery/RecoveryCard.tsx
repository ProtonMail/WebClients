import { c } from 'ttag';
import { ButtonLike, Card, Icon, Loader, SettingsLink } from '../../components';
import { useIsDataRecoveryAvailable, useIsMnemonicAvailable, useRecoveryStatus } from '../../hooks';
import { SettingsSectionTitle } from '../account';
import RecoveryStatusIcon from './RecoveryStatusIcon';
import useIsRecoveryFileAvailable from '../../hooks/useIsRecoveryFileAvailable';
import RecoveryStatusText from './RecoveryStatusText';

interface Props {
    ids: {
        account: string;
        data: string;
    };
}

const RecoveryCard = ({ ids }: Props) => {
    const [{ accountRecoveryStatus, dataRecoveryStatus }, loadingRecoveryStatus] = useRecoveryStatus();

    const [isRecoveryFileAvailable, loadingIsRecoveryFileAvailable] = useIsRecoveryFileAvailable();
    const [isMnemonicAvailable, loadingIsMnemonicAvailable] = useIsMnemonicAvailable();
    const [isDataRecoveryAvailable, loadingIsDataRecoveryAvailable] = useIsDataRecoveryAvailable();

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

    const accountRecoveryStatusText =
        accountRecoveryStatus === 'complete'
            ? c('Info').t`Your account recovery method is set`
            : c('Info').t`No account recovery method set; you are at risk of losing access to your account`;

    const dataRecoveryStatusText =
        dataRecoveryStatus === 'complete'
            ? c('Info').t`Your data recovery method is set`
            : c('Info').t`No data recovery method set; you are at risk of losing access to your data`;

    if (
        loadingRecoveryStatus ||
        loadingIsDataRecoveryAvailable ||
        loadingIsRecoveryFileAvailable ||
        loadingIsMnemonicAvailable
    ) {
        return <Loader />;
    }

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
            </p>

            <h3 className="text-bold text-rg mb1">{c('Title').t`Your recovery status`}</h3>

            <ul className="unstyled m0">
                <li>
                    <span className="flex flex-align-items-center flex-nowrap">
                        <RecoveryStatusIcon className="flex-item-noshrink" status={accountRecoveryStatus} />
                        <RecoveryStatusText className="ml1" status={accountRecoveryStatus}>
                            {accountRecoveryStatusText}
                        </RecoveryStatusText>
                    </span>

                    {accountRecoveryStatus !== 'complete' && (
                        <ul className="unstyled ml4">
                            <li className="flex flex-align-items-center flex-nowrap">
                                <span className="mr0-5">{c('Info').t`Add a recovery email address`}</span>
                                <ButtonLike
                                    className="flex-item-noshrink"
                                    as={SettingsLink}
                                    icon
                                    path={`/recovery#${ids.account}`}
                                    shape="ghost"
                                    color="norm"
                                    size="small"
                                >
                                    <Icon name="arrow-right" />
                                </ButtonLike>
                            </li>
                            <li className="flex flex-align-items-center flex-nowrap">
                                <span className="mr0-5">{c('Info').t`Add a recovery phone number`}</span>
                                <ButtonLike
                                    className="flex-item-noshrink"
                                    as={SettingsLink}
                                    icon
                                    path={`/recovery#${ids.account}`}
                                    shape="ghost"
                                    color="norm"
                                    size="small"
                                >
                                    <Icon name="arrow-right" />
                                </ButtonLike>
                            </li>
                        </ul>
                    )}
                </li>
                {isDataRecoveryAvailable && (
                    <li className="mt0-5">
                        <span className="flex flex-align-items-center flex-nowrap">
                            <RecoveryStatusIcon className="flex-item-noshrink" status={dataRecoveryStatus} />
                            <RecoveryStatusText className="ml1" status={dataRecoveryStatus}>
                                {dataRecoveryStatusText}
                            </RecoveryStatusText>
                        </span>

                        {dataRecoveryStatus !== 'complete' && (
                            <ul className="unstyled ml4">
                                {isRecoveryFileAvailable && (
                                    <li className="flex flex-align-items-center flex-nowrap">
                                        <span className="mr0-5">{c('Info').t`Download your recovery file`}</span>
                                        <ButtonLike
                                            as={SettingsLink}
                                            icon
                                            path={`/recovery#${ids.data}`}
                                            shape="ghost"
                                            color="norm"
                                            size="small"
                                        >
                                            <Icon name="arrow-right" />
                                        </ButtonLike>
                                    </li>
                                )}
                                {isMnemonicAvailable && (
                                    <li className="flex flex-align-items-center flex-nowrap">
                                        <span className="mr0-5">{c('Info').t`Activate your recovery phrase`}</span>
                                        <ButtonLike
                                            as={SettingsLink}
                                            icon
                                            path={`/recovery#${ids.data}`}
                                            shape="ghost"
                                            color="norm"
                                            size="small"
                                        >
                                            <Icon name="arrow-right" />
                                        </ButtonLike>
                                    </li>
                                )}
                            </ul>
                        )}
                    </li>
                )}
            </ul>
        </Card>
    );
};

export default RecoveryCard;
