import { useEffect, useRef, useState } from 'react';
import * as React from 'react';
import { c } from 'ttag';
import { validateEmail, validatePhone } from '@proton/shared/lib/api/core/validate';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { noop } from '@proton/shared/lib/helpers/function';

import {
    Button,
    Challenge,
    useLoading,
    useApi,
    Tabs,
    useFormErrors,
    PhoneInput,
    InputFieldTwo,
    captureChallengeMessage,
    ChallengeResult,
    ChallengeRef,
    AlertModal,
} from '@proton/components';

import { SignupModel, SIGNUP_STEPS } from './interfaces';
import Loader from './Loader';

const { RECOVERY_EMAIL, RECOVERY_PHONE } = SIGNUP_STEPS;

const RecoveryConfirmModal = ({
    open,
    onClose,
    onConfirm,
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}) => {
    return (
        <AlertModal
            open={open}
            onClose={onClose}
            title={c('Title').t`Warning`}
            buttons={[
                <Button
                    color="norm"
                    onClick={async () => {
                        onClose();
                        onConfirm();
                    }}
                >{c('Action').t`Confirm`}</Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            {c('Info')
                .t`You did not set a recovery method so account recovery is impossible if you forget your password. Proceed without recovery method?`}
        </AlertModal>
    );
};

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
    const challengeRefRecovery = useRef<ChallengeRef>();
    const [loading, withLoading] = useLoading();
    const [confirmModal, setConfirmModal] = useState(false);

    const { validator, onFormSubmit } = useFormErrors();

    const getOnChange = (field: keyof SignupModel) => (value: string) => onChange({ [field]: value });

    const setRecoveryPhone = getOnChange('recoveryPhone');
    const setRecoveryEmail = getOnChange('recoveryEmail');

    const handleSubmit = async () => {
        if (loading || !onFormSubmit()) {
            return;
        }

        const payload = await challengeRefRecovery.current?.getChallenge();

        if (model.step === RECOVERY_EMAIL) {
            await api(validateEmail(model.recoveryEmail));
            return onSubmit(payload);
        }

        if (model.step === RECOVERY_PHONE) {
            await api(validatePhone(model.recoveryPhone));
            return onSubmit(payload);
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
            label={c('Label').t`Recovery email address`}
            error={validator(
                model.step === RECOVERY_EMAIL
                    ? [requiredValidator(model.recoveryEmail), emailValidator(model.recoveryEmail)]
                    : []
            )}
            autoFocus
            disableChange={loading}
            type="email"
            value={model.recoveryEmail}
            onValue={(value: string) => {
                setRecoveryEmail(value);
            }}
            onKeyDown={({ key }: React.KeyboardEvent<HTMLInputElement>) => {
                if (key === 'Enter') {
                    withLoading(handleSubmit()).catch(noop);
                }
            }}
        />
    );

    const tabValue = (() => {
        if (model.step === RECOVERY_EMAIL) {
            return 0;
        }

        if (model.step === RECOVERY_PHONE) {
            return 1;
        }

        return 0;
    })();

    return (
        <>
            {model.step === RECOVERY_EMAIL && challengeLoading ? (
                <div className="text-center">
                    <Loader />
                </div>
            ) : null}
            <RecoveryConfirmModal
                open={confirmModal}
                onClose={() => setConfirmModal(false)}
                onConfirm={async () => {
                    const payload = await challengeRefRecovery.current?.getChallenge();
                    onSkip(payload);
                }}
            />
            <form
                name="recoveryForm"
                onSubmit={(e) => {
                    e.preventDefault();
                    withLoading(handleSubmit()).catch(noop);
                }}
                className="top-custom left-custom"
                style={
                    model.step === RECOVERY_EMAIL && challengeLoading
                        ? {
                              position: 'absolute',
                              '--top-custom': '-1000px',
                              '--left-custom': '-1000px',
                          }
                        : undefined
                }
                ref={formRef}
                method="post"
                autoComplete="off"
                noValidate
            >
                <Tabs
                    value={tabValue}
                    tabs={[
                        {
                            title: c('Label').t`Email`,
                            content: (
                                <>
                                    <div className="mb1">
                                        {c('Info')
                                            .t`We will send you a recovery link to this email address if you forget your password or get locked out of your account.`}
                                        <br />
                                        {c('Info').t`This email address will only be used for recovery purposes.`}
                                    </div>
                                </>
                            ),
                        },
                        {
                            title: c('Label').t`Phone`,
                            content: (
                                <>
                                    <div className="mb1">
                                        {c('Info')
                                            .t`We will send a code to this phone number if you forget your password or get locked out of your account.`}
                                        <br />
                                        {c('Info').t`This phone number will only be used for recovery purposes.`}
                                    </div>
                                    <InputFieldTwo
                                        as={PhoneInput}
                                        id="recovery-phone"
                                        bigger
                                        label={c('Label').t`Recovery phone number`}
                                        error={validator(
                                            model.step === RECOVERY_PHONE
                                                ? [requiredValidator(model.recoveryPhone)]
                                                : []
                                        )}
                                        disableChange={loading}
                                        autoFocus
                                        defaultCountry={defaultCountry}
                                        value={model.recoveryPhone}
                                        onChange={(value: string) => {
                                            setRecoveryPhone(value);
                                        }}
                                    />
                                </>
                            ),
                        },
                    ]}
                    onChange={() => {
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
                    onClick={() => setConfirmModal(true)}
                    className="mt0-5"
                >
                    {c('Action').t`Skip`}
                </Button>
            </form>
        </>
    );
};
export default RecoveryForm;
