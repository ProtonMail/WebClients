import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { useMachine } from '@xstate/react';
import { c } from 'ttag';

import { parseJoiningLinkConfig } from '@proton/account/orgJoiningLink/helpers';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { PasswordPolicySpotlight } from '@proton/components/components/passwordPolicy/PasswordPolicy';
import { usePasswordPolicyValidation } from '@proton/components/components/passwordPolicy/usePasswordPolicyValidation';
import PasswordStrengthIndicator from '@proton/components/components/passwordStrengthIndicator/PasswordStrengthIndicator';
import Progress from '@proton/components/components/progress/Progress';
import { InputField as InputFieldTwo } from '@proton/components/components/v2/field/InputField';
import PasswordInputTwo from '@proton/components/components/v2/input/PasswordInput';
import TotpInput from '@proton/components/components/v2/input/TotpInput';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import NotificationButton from '@proton/components/containers/notifications/NotificationButton';
import useDocumentTitle from '@proton/components/hooks/useDocumentTitle';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import { getEmailParts } from '@proton/shared/lib/helpers/email';
import {
    confirmPasswordValidator,
    emailValidator,
    numberValidator,
    passwordLengthValidator,
    requiredValidator,
} from '@proton/shared/lib/helpers/formValidators';

import Header from '../layout/Header';
import Layout from '../layout/Layout';
import Main from '../layout/Main';
import { usePublicAppAuth } from '../publicAppAuth';
import PasswordStrengthIndicatorSpotlight, {
    usePasswordStrengthIndicatorSpotlight,
} from '../signup/PasswordStrengthIndicatorSpotlight';
import ExpiredError from '../standalone/ExpiredError';
import { PublicAppContext } from '../state-machine/PublicAppContext';
import { usePublicAppServices } from '../state-machine/PublicAppServices';
import { runLogin } from '../state-machine/runLogin';
import { createTokenRedemptionActors } from './tokenRedemptionActors';
import {
    selectResending,
    selectStep,
    selectSubmitting,
    tokenRedemptionStateMachine,
    tokenRedemptionSteps,
} from './tokenRedemptionStateMachine';

import './TokenRedemptionContainer.scss';

const toApp = APPS.PROTONMAIL;
const totalSteps = tokenRedemptionSteps.length;

const TokenRedemptionContainer = () => {
    const { onPreSubmit, onStartAuth } = usePublicAppAuth();
    const publicApp = PublicAppContext.useActorRef();
    const { unauthenticatedApi } = usePublicAppServices();
    const location = useLocation();
    const history = useHistory();

    const passwordStrengthIndicatorSpotlight = usePasswordStrengthIndicatorSpotlight();
    const { createNotification } = useNotifications();
    const { validator, onFormSubmit, reset } = useFormErrors();
    const errorHandler = useErrorHandler();

    const [snapshot, send, actorRef] = useMachine(
        tokenRedemptionStateMachine.provide({
            actors: createTokenRedemptionActors({
                unauthenticatedApi,
                onPreSubmit,
                onStartAuth,
                login: (session) => runLogin(publicApp, { ...session, appIntent: { app: toApp } }),
            }),
            actions: {
                clearLinkFromUrl: () => history.replace({ ...location, hash: '' }),
            },
        }),
        { input: { config: parseJoiningLinkConfig({ hash: location.hash }) } }
    );
    const { config, passwordPolicies } = snapshot.context;
    const submitting = selectSubmitting(snapshot);
    const resending = selectResending(snapshot);
    const view = selectStep(snapshot);

    useEffect(() => {
        const subscriptions = [
            actorRef.on('error', ({ error }) => errorHandler(error)),
            actorRef.on('code.resent', () =>
                createNotification({
                    text: c('Info').t`Code has been re-sent.`,
                    type: 'success',
                    showCloseButton: false,
                })
            ),
            actorRef.on('session.expired', () =>
                createNotification({
                    type: 'error',
                    text: (
                        <>
                            <span>{c('Error').t`Session expired. Please refresh the page.`}</span>
                            <NotificationButton onClick={() => window.location.reload()}>
                                {c('Action').t`Refresh the page`}
                            </NotificationButton>
                        </>
                    ),
                })
            ),
        ];
        return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
    }, [actorRef, errorHandler, createNotification]);

    const [emailLocal, setEmailLocal] = useState(config?.username ?? '');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const passwordContainerRef = useRef<HTMLInputElement>(null);
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const passwordPolicyValidation = usePasswordPolicyValidation(newPassword, passwordPolicies);
    const firstPolicyError = passwordPolicyValidation.result.find((result) => !result.valid)?.errorMessage || '';

    const viewConfig = useMemo<{ title: string; subTitle: ReactNode; button: string }>(() => {
        switch (view) {
            case 'email': {
                const orgName = config?.orgName ? <b key="org-name">{config.orgName}</b> : null;
                return {
                    title: c('Title').t`Activate your email`,
                    subTitle: orgName
                        ? c('Title')
                              .jt`Your admin at ${orgName} is inviting you to activate your new secure ${BRAND_NAME} account and update your password.`
                        : c('Title')
                              .jt`Your admin is inviting you to activate your new secure ${BRAND_NAME} account and update your password.`,
                    button: c('Action').t`Confirm email`,
                };
            }
            case 'otp': {
                return {
                    title: c('Title').t`Verify your email`,
                    subTitle: c('Title')
                        .t`We sent you a code to your email to make sure it’s you. This code is valid for 10 minutes. Please enter it below.`,
                    button: c('Action').t`Verify`,
                };
            }
            case 'password': {
                return {
                    title: c('Title').t`Create a new password`,
                    subTitle: '',
                    button: c('Action').t`Finish`,
                };
            }
        }
    }, [view, config]);

    useDocumentTitle(`${viewConfig.title} - ${BRAND_NAME}`);

    if (!config) {
        return (
            <div className="absolute inset-center text-center">
                <ExpiredError type="joining-link" />
            </div>
        );
    }

    const { domain } = config;

    const email = !domain.length ? emailLocal : `${getEmailParts(emailLocal)[0]}@${domain}`;

    const disabled = submitting || resending;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (submitting || !onFormSubmit()) {
            return;
        }

        reset();

        switch (view) {
            case 'email':
                return send({ type: 'email.submitted', email });
            case 'otp':
                return send({ type: 'code.submitted', code: otp });
            case 'password':
                return send({ type: 'password.submitted', password: newPassword });
        }
    };

    const handleResend = () => send({ type: 'code.resendRequested' });

    const handleBack = () => {
        setOtp('');
        send({ type: 'back' });
    };

    const step = tokenRedemptionSteps.indexOf(view) + 1;

    return (
        <Layout hasDecoration toApp={toApp} layoutClassName="token-redemption-container">
            <Main className="flex flex-column">
                <Header title={viewConfig.title} subTitle={viewConfig.subTitle} />
                <form onSubmit={handleSubmit} className="flex flex-column items-start w-full grow">
                    {view === 'email' && (
                        <InputFieldTwo
                            autoFocus
                            name="email"
                            label={c('Label').t`Email address`}
                            placeholder={c('Signup label').t`Your email`}
                            value={emailLocal}
                            onChange={({ target: { value } }) => setEmailLocal(value)}
                            disableChange={disabled}
                            suffix={domain && <span className="color-hint">@{domain}</span>}
                            bigger
                            error={validator([requiredValidator(emailLocal), emailValidator(email)])}
                        />
                    )}
                    {view === 'otp' && (
                        <>
                            <div className="w-full">
                                <InputFieldTwo
                                    id="totp"
                                    as={TotpInput}
                                    key="totp"
                                    length={6}
                                    disableChange={submitting || resending}
                                    autoFocus
                                    autoComplete="one-time-code"
                                    value={otp}
                                    onValue={setOtp}
                                    bigger
                                    error={validator([
                                        requiredValidator(otp),
                                        numberValidator(otp),
                                        otp.length !== 6 ? c('Error').t`Enter 6 digits` : '',
                                    ])}
                                />
                            </div>
                            <Button
                                onClick={handleResend}
                                color="norm"
                                type="button"
                                shape="underline"
                                loading={resending}
                                className="m-0"
                            >{c('Action').t`Resend code`}</Button>
                        </>
                    )}
                    {view === 'password' && (
                        <>
                            <p className="color-norm bg-weak p-4 rounded-lg w-full mt-0 mb-6 user-select">{email}</p>
                            {((input) =>
                                passwordPolicyValidation.enabled ? (
                                    <PasswordPolicySpotlight
                                        wrapper={passwordPolicyValidation}
                                        anchorRef={passwordContainerRef}
                                        enabled={passwordPolicyValidation.enabled}
                                        validationResults={passwordPolicyValidation.result}
                                        password={newPassword}
                                        isAboveModal={false}
                                    >
                                        {input}
                                    </PasswordPolicySpotlight>
                                ) : (
                                    <PasswordStrengthIndicatorSpotlight
                                        wrapper={passwordStrengthIndicatorSpotlight}
                                        password={newPassword}
                                        anchorRef={passwordContainerRef}
                                    >
                                        {input}
                                    </PasswordStrengthIndicatorSpotlight>
                                ))(
                                <InputFieldTwo
                                    as={PasswordInputTwo}
                                    autoComplete="new-password"
                                    autoFocus
                                    name="new-password"
                                    placeholder={c('Label').t`New password`}
                                    value={newPassword}
                                    onChange={({ target: { value } }) => setNewPassword(value)}
                                    disableChange={disabled}
                                    bigger
                                    className={newPassword.length ? '' : 'mb-6'}
                                    assistContainerClassName="assist-container--no-min-height"
                                    containerRef={passwordContainerRef}
                                    error={validator([
                                        requiredValidator(newPassword),
                                        passwordPolicyValidation.enabled
                                            ? firstPolicyError
                                            : passwordLengthValidator(newPassword),
                                    ])}
                                    onFocus={
                                        passwordPolicyValidation.enabled
                                            ? passwordPolicyValidation.handlers.onInputFocus
                                            : passwordStrengthIndicatorSpotlight.onInputFocus
                                    }
                                    onBlur={
                                        passwordPolicyValidation.enabled
                                            ? passwordPolicyValidation.handlers.onInputBlur
                                            : passwordStrengthIndicatorSpotlight.onInputBlur
                                    }
                                />
                            )}
                            {!passwordPolicyValidation.enabled &&
                                passwordStrengthIndicatorSpotlight.spotlight &&
                                passwordStrengthIndicatorSpotlight.supported && (
                                    <PasswordStrengthIndicator
                                        password={newPassword}
                                        className="pb-4"
                                        service={passwordStrengthIndicatorSpotlight.service}
                                    />
                                )}
                            <InputFieldTwo
                                as={PasswordInputTwo}
                                autoComplete="new-password"
                                name="confirm-new-password"
                                rootClassName="mb-4"
                                placeholder={c('Label').t`New password`}
                                value={confirmNewPassword}
                                onChange={({ target: { value } }) => setConfirmNewPassword(value)}
                                disableChange={disabled}
                                bigger
                                error={validator([
                                    requiredValidator(confirmNewPassword),
                                    confirmPasswordValidator(confirmNewPassword, newPassword),
                                ])}
                            />
                        </>
                    )}
                    <div className="flex-1"></div>
                    <div className="w-full">
                        <Progress className="progress-bar--norm mb-4 w-full" value={step} max={totalSteps} />
                    </div>
                    <div className="w-full flex gap-2 items-center">
                        <p className="m-0 color-hint flex-1">
                            {
                                // translator: Step <current step>/<total number of steps>
                                c('Info').t`Step ${step}/${totalSteps}`
                            }
                        </p>
                        {view === 'otp' && (
                            <Button size="large" color="weak" type="button" onClick={handleBack}>
                                {c('Action').t`Back`}
                            </Button>
                        )}
                        <Button size="large" color="norm" type="submit" loading={submitting}>
                            {submitting ? c('Info').t`Loading` : viewConfig.button}
                        </Button>
                    </div>
                </form>
            </Main>
        </Layout>
    );
};

export default TokenRedemptionContainer;
