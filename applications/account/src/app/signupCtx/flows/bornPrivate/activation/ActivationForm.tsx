import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InputFieldTwo, Option, PasswordInputTwo, SelectTwo, useApi } from '@proton/components';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import type { OnLoginCallback } from '@proton/components/containers/app/interface';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { PASSWORD_WRONG_ERROR } from '@proton/shared/lib/api/auth';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import {
    confirmPasswordValidator,
    passwordLengthValidator,
    requiredValidator,
} from '@proton/shared/lib/helpers/formValidators';
import clsx from '@proton/utils/clsx';

import { getOptimisticDomains } from '../../../../signup/helper';
import { useGetAccountKTActivation } from '../../../../useGetAccountKTActivation';
import BornPrivateHeader from '../components/BornPrivateHeader';
import BornPrivateLayout from '../components/BornPrivateLayout';
import BornPrivateMain from '../components/BornPrivateMain';
import BornPrivateFormContainer from '../components/form/BornPrivateFormContainer';
import BornPrivateFormHeading from '../components/form/BornPrivateFormHeading';
import type { ActivationParams } from './helpers/activationHelpers';
import {
    activateReservedAccount,
    getInitialDomainFromParams,
    getInitialUsernameFromParams,
} from './helpers/activationHelpers';

interface ActivationFormProps {
    prefilledParams: ActivationParams | null;
    onLogin: OnLoginCallback;
}

const ActivationForm = ({ prefilledParams, onLogin }: ActivationFormProps) => {
    const isPrefilled = prefilledParams !== null;

    const [username, setUsername] = useState(() => getInitialUsernameFromParams(prefilledParams));
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [activationCode, setActivationCode] = useState(prefilledParams?.activationCode ?? '');
    const [passwordBlurred, setPasswordBlurred] = useState(false);
    const [confirmPasswordBlurred, setConfirmPasswordBlurred] = useState(false);

    const [submitting, withSubmitting] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();
    const { createNotification } = useNotifications();
    const api = useApi();
    const getKtActivation = useGetAccountKTActivation();
    const [domains, setDomains] = useState(() => getOptimisticDomains());
    const [domain, setDomain] = useState(() => getInitialDomainFromParams(getOptimisticDomains(), prefilledParams));

    useEffect(() => {
        const init = async () => {
            const { Domains } = await api<{ Domains: string[] }>(queryAvailableDomains('login'));
            if (Domains.length > 0) {
                setDomains(Domains);
                setDomain((current) => (Domains.includes(current) ? current : Domains[0]));
            }
        };
        void init();
    }, [api]);

    const handleSubmit = () => {
        if (!onFormSubmit()) {
            return;
        }

        const run = async () => {
            try {
                const keyTransparencyActivation = await getKtActivation();
                const session = await activateReservedAccount({
                    username,
                    domain,
                    activationCode,
                    newPassword,
                    api,
                    keyTransparencyActivation,
                });

                createNotification({ text: c('Success').t`Your address has been activated` });
                await onLogin({ data: session, loginPassword: newPassword, appIntent: { app: APPS.PROTONMAIL } });
            } catch (error: any) {
                const errorMessage =
                    error?.data?.Code === PASSWORD_WRONG_ERROR
                        ? c('Error')
                              .t`Activation failed. The details may be incorrect, or the email is already active. Please check your input or sign in.`
                        : error?.data?.Error || c('Error').t`Failed to activate your address. Please try again.`;
                createNotification({ type: 'error', text: errorMessage });
                throw error;
            }
        };

        void withSubmitting(run());
    };

    const domainSuffix = isPrefilled ? (
        <span className="text-ellipsis color-hint" title={`@${domain}`}>
            @{domain}
        </span>
    ) : (
        <SelectTwo
            id="select-domain"
            originalPlacement="bottom-end"
            unstyled
            value={domain}
            onChange={({ value }) => setDomain(value)}
        >
            {domains.map((domain: string) => (
                <Option key={domain} value={domain} title={domain}>
                    @{domain}
                </Option>
            ))}
        </SelectTwo>
    );

    return (
        <BornPrivateLayout>
            <BornPrivateHeader />
            <BornPrivateMain>
                <BornPrivateFormContainer onSubmit={handleSubmit}>
                    <BornPrivateFormHeading className="text-center">{c('Heading')
                        .t`Activate your reserved email address`}</BornPrivateFormHeading>

                    <div className="mt-6">
                        <InputFieldTwo
                            id="username"
                            label={c('Label').t`Reserved email address`}
                            value={username}
                            onValue={setUsername}
                            suffix={domainSuffix}
                            readOnly={isPrefilled}
                            rootClassName={clsx(isPrefilled && 'pointer-events-none')}
                            error={validator([requiredValidator(username)])}
                            autoFocus={!isPrefilled}
                            bigger
                        />
                    </div>

                    <div className="mt-2">
                        <InputFieldTwo
                            id="new-password"
                            label={c('Label').t`Set password`}
                            as={PasswordInputTwo}
                            autoComplete="new-password"
                            value={newPassword}
                            onValue={(value: string) => setNewPassword(value)}
                            onBlur={() => setPasswordBlurred(true)}
                            error={
                                validator([requiredValidator(newPassword), passwordLengthValidator(newPassword)]) ||
                                (passwordBlurred
                                    ? requiredValidator(newPassword) || passwordLengthValidator(newPassword)
                                    : '')
                            }
                            disabled={submitting}
                            autoFocus={isPrefilled}
                            bigger
                        />
                    </div>

                    <div className="mt-2">
                        <InputFieldTwo
                            id="confirm-password"
                            label={c('Label').t`Confirm password`}
                            as={PasswordInputTwo}
                            autoComplete="new-password"
                            value={confirmPassword}
                            onValue={(value: string) => setConfirmPassword(value)}
                            onBlur={() => setConfirmPasswordBlurred(true)}
                            error={
                                validator([
                                    requiredValidator(confirmPassword),
                                    confirmPasswordValidator(newPassword, confirmPassword),
                                ]) ||
                                (confirmPasswordBlurred
                                    ? requiredValidator(confirmPassword) ||
                                      confirmPasswordValidator(newPassword, confirmPassword)
                                    : '')
                            }
                            disabled={submitting}
                            bigger
                        />
                    </div>

                    {!isPrefilled && (
                        <div className="mt-2 ">
                            <InputFieldTwo
                                id="activation-code"
                                label={c('Label').t`Activation code`}
                                value={activationCode}
                                onValue={setActivationCode}
                                error={validator([requiredValidator(activationCode)])}
                                disabled={submitting}
                                bigger
                                assistiveText={
                                    <Link
                                        to={{
                                            pathname: SSO_PATHS.BORN_PRIVATE_RECOVERY,
                                            state: { reservedEmail: `${username}@${domain}` },
                                        }}
                                        className="color-weak text-underline mt-1"
                                    >
                                        {c('Link').t`Can't find your code?`}
                                    </Link>
                                }
                            />
                        </div>
                    )}

                    <div className="mt-8">
                        <Button type="submit" color="norm" size="large" className="rounded w-full" loading={submitting}>
                            {c('Action').t`Activate this address`}
                        </Button>
                    </div>

                    {isPrefilled && (
                        <div className="mt-4 text-center">
                            <div className="color-hint text-semibold text-sm">{c('Label').t`Activation code`}</div>
                            <div className="color-hint text-lg mt-1">{activationCode}</div>
                        </div>
                    )}
                </BornPrivateFormContainer>
            </BornPrivateMain>
        </BornPrivateLayout>
    );
};

export default ActivationForm;
