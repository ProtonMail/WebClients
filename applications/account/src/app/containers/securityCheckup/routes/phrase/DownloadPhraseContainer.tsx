import { useEffect, useState } from 'react';
import { Link, Redirect } from 'react-router-dom';

import { c } from 'ttag';

import { useInactiveKeys, userThunk } from '@proton/account';
import { useUser } from '@proton/account/user/hooks';
import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import { Button, ButtonLike, CircleLoader } from '@proton/atoms';
import { Checkbox, Icon, Label, useApi, useSecurityCheckup } from '@proton/components';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { reactivateMnemonicPhrase, updateMnemonicPhrase } from '@proton/shared/lib/api/settingsMnemonic';
import {
    BRAND_NAME,
    HTTP_STATUS_CODE,
    RECOVERY_KIT_FILE_NAME,
    SECURITY_CHECKUP_PATHS,
} from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import generateDeferredMnemonicData from '../../../recoveryPhrase/generateDeferredMnemonicData';
import type { DeferredMnemonicData } from '../../../recoveryPhrase/types';
import methodErrorSrc from '../../assets/method-error.svg';
import methodSuccessSrc from '../../assets/method-success.svg';
import SecurityCheckupMain from '../../components/SecurityCheckupMain';
import SecurityCheckupMainIcon from '../../components/SecurityCheckupMainIcon';
import SecurityCheckupMainTitle from '../../components/SecurityCheckupMainTitle';
import { phraseIcon } from '../../methodIcons';
import recoveryKitSrc from './recovery-kit.svg';

enum STEPS {
    DOWNLOAD,
    ERROR,
    SUCCESS,
}

const DownloadPhrase = ({ recoveryPhraseData }: { recoveryPhraseData: DeferredMnemonicData }) => {
    const api = useApi();
    const dispatch = useDispatch();

    const { securityState } = useSecurityCheckup();
    const { phrase } = securityState;

    const [step, setStep] = useState(STEPS.DOWNLOAD);

    const [downloading, withDownloading] = useLoading();

    const [{ MnemonicStatus }] = useUser();

    const inactiveKeys = useInactiveKeys();
    const [understood, setUnderstood] = useState(false);

    if (!phrase.isAvailable) {
        return <Redirect to={SECURITY_CHECKUP_PATHS.ROOT} />;
    }

    if (step === STEPS.ERROR) {
        return (
            <SecurityCheckupMain className="text-center">
                <div className="flex justify-center">
                    <img src={methodErrorSrc} alt="" />
                </div>

                <SecurityCheckupMainTitle>
                    {c('Safety review').t`There was an error generating your Recovery Kit`}
                </SecurityCheckupMainTitle>

                <div>
                    {c('Safety review')
                        .t`We encountered an error while generating your Recovery Kit. Please try again later, or contact support if the issue continues.`}
                </div>

                <ButtonLike className="mt-8" fullWidth as={Link} to={SECURITY_CHECKUP_PATHS.ROOT} color="norm">
                    {c('Safety review').t`Back to Safety Review`}
                </ButtonLike>
            </SecurityCheckupMain>
        );
    }

    if (step === STEPS.SUCCESS) {
        return (
            <SecurityCheckupMain>
                <SecurityCheckupMainTitle prefix={<SecurityCheckupMainIcon icon={phraseIcon} color="success" />}>
                    {c('Safety review').t`Your Recovery Kit is set`}
                </SecurityCheckupMainTitle>

                <div className="border rounded flex flex-column gap-2 items-center justify-center p-6">
                    <img src={methodSuccessSrc} alt="" />
                    <div className="text-bold">{RECOVERY_KIT_FILE_NAME}</div>
                </div>

                <div className="mt-6">
                    {c('Safety review')
                        .t`You can use the recovery phrase in this Recovery Kit to fully restore your account when you reset your password, so make sure you keep it somewhere safe.`}
                </div>

                <ButtonLike className="mt-8" fullWidth as={Link} to={SECURITY_CHECKUP_PATHS.ROOT} color="norm" replace>
                    {c('Safety review').t`Continue to Safety Review`}
                </ButtonLike>
            </SecurityCheckupMain>
        );
    }

    if (!recoveryPhraseData.recoveryKitBlob) {
        // TODO: use the recovery copy fallback in this case
        return <Redirect to={SECURITY_CHECKUP_PATHS.ROOT} />;
    }

    const blob = recoveryPhraseData.recoveryKitBlob;

    const downloadRecoveryKit = async () => {
        downloadFile(blob, RECOVERY_KIT_FILE_NAME);
        await dispatch(userThunk({ cache: CacheType.None }));

        setStep(STEPS.SUCCESS);
    };

    const handleDownload = async () => {
        const callReactivateEndpoint =
            MnemonicStatus === MNEMONIC_STATUS.ENABLED ||
            MnemonicStatus === MNEMONIC_STATUS.OUTDATED ||
            MnemonicStatus === MNEMONIC_STATUS.PROMPT;

        try {
            if (callReactivateEndpoint) {
                await api(reactivateMnemonicPhrase(recoveryPhraseData.payload));
            } else {
                await api(updateMnemonicPhrase({ ...recoveryPhraseData.payload, PersistPasswordScope: true }));
            }

            await downloadRecoveryKit();
        } catch (error: any) {
            const { status } = getApiError(error);
            if (status === HTTP_STATUS_CODE.FORBIDDEN) {
                return;
            }

            setStep(STEPS.ERROR);
        }
    };

    const size = `(${humanSize({ bytes: recoveryPhraseData.recoveryKitBlob.size })})`;

    const showUnderstoodCheckBox = phrase.isOutdated && !!inactiveKeys.length;

    return (
        <SecurityCheckupMain>
            <SecurityCheckupMainTitle
                prefix={
                    <SecurityCheckupMainIcon
                        icon={phraseIcon}
                        color={phrase.isSet || phrase.isOutdated ? 'warning' : 'danger'}
                    />
                }
            >
                {phrase.isSet || phrase.isOutdated
                    ? c('Safety review').t`Update your Recovery Kit?`
                    : c('Safety review').t`Download your Recovery Kit`}
            </SecurityCheckupMainTitle>

            <div>
                <img className="w-full mb-6" src={recoveryKitSrc} alt="" />
            </div>

            <div className="flex flex-column gap-4">
                {phrase.isOutdated ? (
                    <div>
                        {c('Safety review')
                            .t`Because you reset your password, your current Recovery Kit can only be used to recover the data created before your password reset.`}
                    </div>
                ) : (
                    <>
                        <div>
                            {c('Safety review')
                                .t`If you get locked out of your ${BRAND_NAME} Account, your Recovery Kit will allow you to sign in and recover your data.`}
                        </div>

                        <div>
                            {c('Safety review')
                                .t`It’s the only way to fully restore your account, so make sure you keep it somewhere safe.`}
                        </div>
                    </>
                )}

                {phrase.isSet || phrase.isOutdated ? (
                    <div>
                        {getBoldFormattedText(
                            c('Safety review')
                                .t`You have previously downloaded a Recovery Kit. Downloading a new one will **deactivate the old one**.`
                        )}
                    </div>
                ) : null}

                {showUnderstoodCheckBox ? (
                    <div className="flex flex-row items-start">
                        <Checkbox
                            id="understood-recovery-necessity"
                            className="mt-2 mr-2"
                            checked={understood}
                            onChange={downloading ? noop : () => setUnderstood(!understood)}
                        />
                        <Label htmlFor="understood-recovery-necessity" className="flex-1">
                            {c('Safety review')
                                .t`I understand that I will not be able to recover currently locked data with this Recovery Kit`}
                        </Label>
                    </div>
                ) : null}
            </div>

            <Button
                className="mt-8"
                fullWidth
                color="norm"
                loading={downloading}
                disabled={showUnderstoodCheckBox && !understood}
                onClick={() => withDownloading(handleDownload)}
            >
                <Icon name="arrow-down-line" className="mr-2" />
                {c('Safety review').t`Download ${size}`}
            </Button>
        </SecurityCheckupMain>
    );
};

const DownloadPhraseContainer = () => {
    const api = useApi();

    const getUserKeys = useGetUserKeys();

    const [{ Email, Name }] = useUser();

    const [generatingData, withGeneratingData] = useLoading(true);

    const [recoveryPhraseData, setRecoveryPhraseData] = useState<DeferredMnemonicData>();

    useEffect(() => {
        const generateMnemonicData = async () => {
            const emailAddress = Email || Name || '';
            const data = await generateDeferredMnemonicData({ api, emailAddress, username: Name, getUserKeys });

            setRecoveryPhraseData(data);
        };

        void withGeneratingData(generateMnemonicData());
    }, []);

    if (generatingData || !recoveryPhraseData) {
        return (
            <SecurityCheckupMain className="flex items-center justify-center">
                <CircleLoader size="medium" className="my-16 color-primary" />
            </SecurityCheckupMain>
        );
    }
    return <DownloadPhrase recoveryPhraseData={recoveryPhraseData} />;
};

export default DownloadPhraseContainer;
