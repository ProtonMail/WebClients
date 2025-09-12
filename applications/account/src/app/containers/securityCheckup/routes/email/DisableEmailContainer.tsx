import { useState } from 'react';
import { Link, Redirect } from 'react-router-dom';

import { c } from 'ttag';

import { userSettingsThunk } from '@proton/account/userSettings';
import { Button, ButtonLike } from '@proton/atoms';
import { useApi, useSecurityCheckup } from '@proton/components';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities';
import { updateResetEmail } from '@proton/shared/lib/api/settings';
import { SECURITY_CHECKUP_PATHS } from '@proton/shared/lib/constants';

import methodSuccessSrc from '../../assets/method-success.svg';
import SecurityCheckupMain from '../../components/SecurityCheckupMain';
import SecurityCheckupMainIcon from '../../components/SecurityCheckupMainIcon';
import SecurityCheckupMainTitle from '../../components/SecurityCheckupMainTitle';
import { emailIcon } from '../../methodIcons';

enum STEPS {
    DISABLE,
    SUCCESS,
}

const DisableEmailContainer = () => {
    const api = useApi();
    const { securityState } = useSecurityCheckup();
    const { email } = securityState;
    const dispatch = useDispatch();

    const [step, setStep] = useState<STEPS>(STEPS.DISABLE);

    const [disabling, withDisabling] = useLoading();

    if (!email.value || (!email.isEnabled && !disabling && step === STEPS.DISABLE)) {
        return <Redirect to={SECURITY_CHECKUP_PATHS.ROOT} />;
    }

    if (step === STEPS.SUCCESS) {
        return (
            <SecurityCheckupMain>
                <SecurityCheckupMainTitle prefix={<SecurityCheckupMainIcon icon={emailIcon} color="success" />}>
                    {c('Safety review').t`Account reset by email has been disabled`}
                </SecurityCheckupMainTitle>

                <div className="border rounded flex flex-column gap-2 items-center justify-center p-6">
                    <img src={methodSuccessSrc} alt="" />
                    <div className="text-bold">{email.value}</div>
                </div>

                <div className="mt-6">
                    {
                        // TODO: copy: this sounds like we're blaming the user. This is a recommendation for high security accounts, not a restriction.
                        c('Safety review').t`You will no longer be able to use this address to reset your account.`
                    }
                </div>

                <ButtonLike className="mt-8" fullWidth as={Link} to={SECURITY_CHECKUP_PATHS.ROOT} color="norm" replace>
                    {c('Safety review').t`Continue to Safety Review`}
                </ButtonLike>
            </SecurityCheckupMain>
        );
    }

    const disablePasswordResetViaEmail = async () => {
        await api(updateResetEmail({ Reset: 0, PersistPasswordScope: true }));

        await dispatch(userSettingsThunk({ cache: CacheType.None }));
        setStep(STEPS.SUCCESS);
    };

    return (
        <SecurityCheckupMain>
            <SecurityCheckupMainTitle prefix={<SecurityCheckupMainIcon icon={emailIcon} color="danger" />}>
                {c('Safety review').t`Disable account reset by email`}
            </SecurityCheckupMainTitle>

            <div className="mb-2">{c('Safety review').t`Your email address is:`}</div>
            <div className="rounded bg-weak p-3 mb-4">{email.value}</div>

            <div>
                {
                    // TODO: copy:
                    getBoldFormattedText(
                        c('Safety review')
                            .t`**Disable account reset by email** to ensure highest possible security of your account.`
                    )
                }
            </div>

            <Button
                className="mt-8"
                fullWidth
                color="norm"
                onClick={() => withDisabling(disablePasswordResetViaEmail)}
                loading={disabling}
            >
                {c('Safety review').t`Disable account reset by email`}
            </Button>
        </SecurityCheckupMain>
    );
};

export default DisableEmailContainer;
