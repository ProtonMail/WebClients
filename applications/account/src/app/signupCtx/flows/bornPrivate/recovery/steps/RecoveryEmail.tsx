import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InputFieldTwo, useApi, useNotifications } from '@proton/components';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { useLoading } from '@proton/hooks';
import { requestLoginResetToken } from '@proton/shared/lib/api/reset';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import BornPrivateHeader from '../../components/BornPrivateHeader';
import BornPrivateLayout from '../../components/BornPrivateLayout';
import BornPrivateMain from '../../components/BornPrivateMain';
import BornPrivateFormContainer from '../../components/form/BornPrivateFormContainer';
import BornPrivateFormHeading from '../../components/form/BornPrivateFormHeading';

interface RecoveryEmailProps {
    reservedEmail?: string;
    onContinue: (reservedEmail: string, parentEmail: string) => void;
    onBack: () => void;
}

const RecoveryEmail = ({ reservedEmail, onContinue, onBack }: RecoveryEmailProps) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [localReservedEmail, setLocalReservedEmail] = useState('');
    const [parentEmail, setParentEmail] = useState('');
    const { validator, onFormSubmit } = useFormErrors();
    const hasUsername = Boolean(reservedEmail && reservedEmail.includes('@') && reservedEmail.split('@')[0]);
    const usernameToUse = hasUsername ? reservedEmail! : localReservedEmail;

    const handleSubmit = async () => {
        if (!onFormSubmit()) {
            return;
        }

        await api(
            requestLoginResetToken({
                Username: usernameToUse,
                Email: parentEmail,
            })
        );

        createNotification({
            text: c('Success').t`Verification code sent to ${parentEmail}`,
            type: 'success',
        });
        onContinue(usernameToUse, parentEmail);
    };

    const subtitle = hasUsername
        ? c('Info').t`Enter the email address used to reserve ${reservedEmail}.`
        : c('Info').t`Enter the reserved email address and the email address used during reservation.`;

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
                        .t`Recover activation voucher`}</BornPrivateFormHeading>

                    <p className="color-weak text-center mt-2 mb-0 text-lg">{subtitle}</p>

                    {!hasUsername && (
                        <div className="mt-6">
                            <InputFieldTwo
                                id="reserved-email"
                                type="email"
                                label={c('Label').t`Reserved address`}
                                autoComplete="email"
                                value={localReservedEmail}
                                onValue={setLocalReservedEmail}
                                error={validator([
                                    requiredValidator(localReservedEmail),
                                    emailValidator(localReservedEmail),
                                ])}
                                autoFocus
                                bigger
                            />
                        </div>
                    )}

                    <div className="mt-2">
                        <InputFieldTwo
                            id="parent-email"
                            type="email"
                            label={c('Label').t`Email address`}
                            autoComplete="email"
                            value={parentEmail}
                            onValue={setParentEmail}
                            error={validator([requiredValidator(parentEmail), emailValidator(parentEmail)])}
                            autoFocus={hasUsername}
                            bigger
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
                            {c('Action').t`Send verification code`}
                        </Button>
                    </div>
                </BornPrivateFormContainer>
            </BornPrivateMain>
        </BornPrivateLayout>
    );
};

export default RecoveryEmail;
