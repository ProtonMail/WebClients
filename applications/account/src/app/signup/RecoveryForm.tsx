import React, { useEffect, useRef, useState } from 'react';
import { c } from 'ttag';
import { validateEmail, validatePhone } from '@proton/shared/lib/api/core/validate';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { noop } from '@proton/shared/lib/helpers/function';

import {
    Button,
    Challenge,
    useModals,
    useLoading,
    useApi,
    Tabs,
    useFormErrors,
    ConfirmModal,
    PhoneInput,
    InputFieldTwo,
    captureChallengeMessage,
    ChallengeResult,
    ChallengeRef,
} from '@proton/components';

import { SignupModel, SIGNUP_STEPS } from './interfaces';
import Loader from './Loader';

const { RECOVERY_EMAIL, RECOVERY_PHONE } = SIGNUP_STEPS;

interface Props {
    model: SignupModel;
    onChange: (model: Partial<SignupModel>) => void;
    onSubmit: (payload?: ChallengeResult) => void;
    onSkip: (payload?: ChallengeResult) => void;
    defaultCountry?: string;
    hasChallenge?: boolean;
}

const RecoveryForm = ({ model, hasChallenge, onChange, onSubmit, onSkip, defaultCountry }: Props) => {
    const api = useApi();
    const formRef = useRef<HTMLFormElement>(null);
    const [challengeLoading, setChallengeLoading] = useState(hasChallenge);
    const { createModal } = useModals();
    const challengeRefRecovery = useRef<ChallengeRef>();
    const [loading, withLoading] = useLoading();
    const [phoneError, setPhoneError] = useState('');
    const [emailError, setEmailError] = useState('');

    const { validator, onFormSubmit } = useFormErrors();

    const getOnChange = (field: keyof SignupModel) => (value: string) => onChange({ [field]: value });

    const setRecoveryPhone = getOnChange('recoveryPhone');
    const setRecoveryEmail = getOnChange('recoveryEmail');

    const handleSkip = async () => {
        await new Promise<void>((resolve, reject) => {
            createModal(
                <ConfirmModal title={c('Title').t`Warning`} onConfirm={resolve} onClose={reject} mode="alert">
                    {c('Info')
                        .t`You did not set a recovery method so account recovery is impossible if you forget your password. Proceed without recovery method?`}
                </ConfirmModal>
            );
        });
        if (model.step === RECOVERY_EMAIL) {
            const payload = await challengeRefRecovery.current?.getChallenge();
            return onSkip(payload);
        }
        onSkip();
    };

    const handleSubmit = async () => {
        if (loading || !onFormSubmit()) {
            return;
        }

        if (model.step === RECOVERY_EMAIL) {
            const payload = await challengeRefRecovery.current?.getChallenge();
            try {
                await api(validateEmail(model.recoveryEmail));
                return onSubmit(payload);
            } catch (error) {
                setEmailError(getApiErrorMessage(error) || c('Error').t`Can't validate email, try again later`);
                throw error;
            }
        }

        if (model.step === RECOVERY_PHONE) {
            try {
                await api(validatePhone(model.recoveryPhone));
                return onSubmit();
            } catch (error) {
                setPhoneError(getApiErrorMessage(error) || c('Error').t`Can't validate phone, try again later`);
                throw error;
            }
        }
    };

    useEffect(() => {
        if (model.step === RECOVERY_EMAIL && !challengeLoading) {
            // Special focus management for challenge
            challengeRefRecovery.current?.focus('#recovery-email');
        }
    }, [model.step, challengeLoading]);

    const innerChallenge = model.step === RECOVERY_EMAIL && (
        <InputFieldTwo
            id="recovery-email"
            bigger
            label={c('Label').t`Recovery email`}
            error={validator(
                model.step === RECOVERY_EMAIL
                    ? [requiredValidator(model.recoveryEmail), emailValidator(model.recoveryEmail), emailError]
                    : []
            )}
            autoFocus
            disableChange={loading}
            type="email"
            value={model.recoveryEmail}
            onValue={(value: string) => {
                setEmailError('');
                setRecoveryEmail(value);
            }}
            onKeyDown={({ key }: React.KeyboardEvent<HTMLInputElement>) => {
                if (key === 'Enter') {
                    withLoading(handleSubmit()).catch(noop);
                }
            }}
        />
    );

    return (
        <>
            {model.step === RECOVERY_EMAIL && challengeLoading ? (
                <div className="text-center">
                    <Loader />
                </div>
            ) : null}
            <form
                name="recoveryForm"
                onSubmit={(e) => {
                    e.preventDefault();
                    withLoading(handleSubmit()).catch(noop);
                }}
                style={
                    model.step === RECOVERY_EMAIL && challengeLoading
                        ? {
                              position: 'absolute',
                              top: '-1000px',
                              left: '-1000px',
                          }
                        : undefined
                }
                ref={formRef}
                method="post"
                autoComplete="off"
                noValidate
            >
                <Tabs
                    value={model.step === RECOVERY_EMAIL ? 0 : model.step === RECOVERY_PHONE ? 1 : 0}
                    tabs={[
                        {
                            title: c('Label').t`Email`,
                            content: (
                                <>
                                    <div className="mb1-75">
                                        {c('Info')
                                            .t`We will send you a recovery link to this email address if you forget your password or get locked out of your account.`}
                                    </div>
                                </>
                            ),
                        },
                        {
                            title: c('Label').t`Phone`,
                            content: (
                                <>
                                    <div className="mb1-75">
                                        {c('Info')
                                            .t`We will send a code to this phone number if you forget your password or get locked out of your account.`}
                                    </div>
                                    <InputFieldTwo
                                        as={PhoneInput}
                                        id="recovery-phone"
                                        bigger
                                        label={c('Label').t`Recovery phone`}
                                        error={validator(
                                            model.step === RECOVERY_PHONE
                                                ? [requiredValidator(model.recoveryPhone), phoneError]
                                                : []
                                        )}
                                        disableChange={loading}
                                        autoFocus
                                        defaultCountry={defaultCountry}
                                        value={model.recoveryPhone}
                                        onChange={(value: string) => {
                                            setPhoneError('');
                                            setRecoveryPhone(value);
                                        }}
                                    />
                                </>
                            ),
                        },
                    ]}
                    onChange={() => {
                        setEmailError('');
                        setPhoneError('');
                        onChange({
                            step: model.step === RECOVERY_EMAIL ? RECOVERY_PHONE : RECOVERY_EMAIL,
                            recoveryEmail: '',
                            recoveryPhone: '',
                        });
                    }}
                />
                {hasChallenge ? (
                    <Challenge
                        key="challenge"
                        style={model.step === RECOVERY_EMAIL ? undefined : { display: 'none' }}
                        bodyClassName="sign-layout-container"
                        challengeRef={challengeRefRecovery}
                        type={1}
                        name="recovery"
                        onSuccess={(logs) => {
                            setChallengeLoading(false);
                            captureChallengeMessage('Failed to load RecoveryAccountForm iframe partially', logs);
                        }}
                        onError={(logs) => {
                            setChallengeLoading(false);
                            captureChallengeMessage('Failed to load RecoveryAccountForm iframe fatally', logs);
                        }}
                    >
                        {innerChallenge}
                    </Challenge>
                ) : (
                    innerChallenge
                )}
                <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt1-75">
                    {c('Action').t`Next`}
                </Button>
                <Button
                    size="large"
                    color="norm"
                    shape="ghost"
                    type="button"
                    fullWidth
                    disabled={loading}
                    onClick={handleSkip}
                    className="mt0-5"
                >
                    {c('Action').t`Skip`}
                </Button>
            </form>
        </>
    );
};
export default RecoveryForm;
