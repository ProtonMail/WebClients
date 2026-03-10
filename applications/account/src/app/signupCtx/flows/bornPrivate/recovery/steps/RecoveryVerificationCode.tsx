import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InputFieldTwo, useApi } from '@proton/components';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { useLoading } from '@proton/hooks';
import { resetKeysRoute } from '@proton/shared/lib/api/keys';
import { requestLoginResetToken, validateResetToken } from '@proton/shared/lib/api/reset';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { generateKeySaltAndPassphrase } from '@proton/shared/lib/keys/keys';
import { srpVerify } from '@proton/shared/lib/srp';
import noop from '@proton/utils/noop';

import BornPrivateHeader from '../../components/BornPrivateHeader';
import BornPrivateLayout from '../../components/BornPrivateLayout';
import BornPrivateMain from '../../components/BornPrivateMain';
import BornPrivateFormContainer from '../../components/form/BornPrivateFormContainer';
import BornPrivateFormHeading from '../../components/form/BornPrivateFormHeading';
import { generateReadableActivationCode } from '../../emailReservation/helpers/emailReservationHelpers';
import { authenticateDonationUser } from '../../emailReservation/helpers/emailReservationRequests';
import { recoverBornPrivateDetails } from '../helpers/recoveryRequests';

interface RecoveryVerificationCodeProps {
    reservedEmail: string;
    parentEmail: string;
    onContinue: () => void;
    onBack: () => void;
}

const RecoveryVerificationCode = ({
    reservedEmail,
    parentEmail,
    onContinue,
    onBack,
}: RecoveryVerificationCodeProps) => {
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const [resendLoading, withResendLoading] = useLoading();
    const [token, setToken] = useState('');
    const { validator, onFormSubmit } = useFormErrors();
    const [username, domain] = reservedEmail.split('@');

    const handleSubmit = async () => {
        if (!onFormSubmit()) {
            return;
        }

        await api(validateResetToken(reservedEmail, token));

        const activationCode = generateReadableActivationCode();

        const { salt } = await generateKeySaltAndPassphrase(activationCode);

        // Born private account has no keys but this resets the password using the token
        await srpVerify({
            api,
            credentials: { password: activationCode },
            config: resetKeysRoute({
                Username: reservedEmail,
                Token: token,
                KeySalt: salt,
            }),
        });

        const auth = await authenticateDonationUser({
            username,
            domain,
            password: activationCode,
            api,
        });

        await recoverBornPrivateDetails({
            api,
            auth,
            parentEmail,
            reservedEmail,
            activationKey: activationCode,
        });

        onContinue();
    };

    const handleResend = async () => {
        await api(
            requestLoginResetToken({
                Username: reservedEmail,
                Email: parentEmail,
            })
        );
    };

    const subtitle = c('Info (sub-heading)').t`Enter the verification code that was sent to ${parentEmail}.`;

    return (
        <BornPrivateLayout>
            <BornPrivateHeader />
            <BornPrivateMain>
                <BornPrivateFormContainer
                    onSubmit={() => {
                        void withLoading(handleSubmit());
                    }}
                >
                    <BornPrivateFormHeading className="text-center">{c('Heading')
                        .t`Enter verification code`}</BornPrivateFormHeading>

                    <p className="color-weak text-center mt-2 mb-0 text-lg">{subtitle}</p>

                    <div className="mt-6">
                        <InputFieldTwo
                            id="recovery-token"
                            bigger
                            label={c('Label').t`Verification code`}
                            value={token}
                            onValue={setToken}
                            error={validator([requiredValidator(token)])}
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    <div className="mt-2 flex flex-column-reverse md:flex-row gap-4">
                        <Button
                            type="button"
                            color="weak"
                            size="large"
                            className="w-full md:w-1/4 rounded-lg"
                            onClick={onBack}
                            disabled={loading}
                        >
                            {c('Action').t`Back`}
                        </Button>
                        <Button
                            type="submit"
                            color="norm"
                            size="large"
                            className="w-full md:flex-1 md:w-3/4 rounded-lg"
                            loading={loading}
                        >
                            {c('Action').t`Verify code`}
                        </Button>
                    </div>

                    <Button
                        type="button"
                        color="norm"
                        shape="ghost"
                        size="large"
                        fullWidth
                        className="mt-2 rounded-lg"
                        disabled={loading || resendLoading}
                        loading={resendLoading}
                        onClick={() => {
                            void withResendLoading(handleResend()).catch(noop);
                        }}
                    >
                        {c('Action').t`Didn't receive a code?`}
                    </Button>
                </BornPrivateFormContainer>
            </BornPrivateMain>
        </BornPrivateLayout>
    );
};

export default RecoveryVerificationCode;
