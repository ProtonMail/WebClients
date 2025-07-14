import type { KeyboardEvent, MutableRefObject, ReactNode } from 'react';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';

import { c } from 'ttag';

import BYOESignupButton from '@proton/activation/src/components/Signup/BYOESignupButton';
import { CircleLoader, InlineLinkButton } from '@proton/atoms';
import { Challenge, DropdownSizeUnit, Icon, Info, InputFieldTwo, Option, PasswordInputTwo } from '@proton/components';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { PLANS } from '@proton/payments';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { BRAND_NAME, CALENDAR_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getMinPasswordLengthMessage } from '@proton/shared/lib/helpers/formValidators';
import { useFlag, useVariant } from '@proton/unleash/index';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { usePublicTheme } from '../containers/PublicThemeProvider';
import PasswordStrengthIndicatorSpotlight from '../signup/PasswordStrengthIndicatorSpotlight';
import challengeIconsSvg from '../signup/challenge-icons.source.svg';
import { getThemeData } from '../signup/challenge-theme';
import { type AccountData, SignupType } from '../signup/interfaces';
import { useAccountFormDataContext } from '../signupCtx/context/accountData/AccountFormDataContext';
import { AsyncValidationStateValue } from '../signupCtx/context/accountData/asyncValidator/createAsyncValidator';
import type { BaseMeasure, SignupModelV2 } from './interface';
import type { AvailableExternalEvents, InteractCreateEvents, UserCheckoutEvents } from './measure';

import '../signup/AccountStep.scss';

export interface AccountStepDetailsRef {
    validate: () => Promise<boolean>;
    data: () => Promise<AccountData>;
    scrollInto: (target: 'email' | 'password' | 'passwordConfirm') => void;
}

const joinUsernameDomain = (username: string, domain: string) => {
    return [username, '@', domain].join('');
};

interface Props {
    accountStepDetailsRef: MutableRefObject<AccountStepDetailsRef | undefined>;
    disableChange: boolean;
    emailDisabled?: boolean;
    emailReadOnly?: boolean;
    onSubmit?: () => void;
    model: SignupModelV2;
    measure: BaseMeasure<InteractCreateEvents | UserCheckoutEvents | AvailableExternalEvents>;
    passwordFields: boolean;
    footer: (data: { emailAlreadyUsed: boolean; email: string }) => ReactNode;
    emailDescription?: ReactNode;
    hideEmailLabel?: boolean;
    onFormValidChange: (isValid: boolean) => void;
}

const AccountStepDetails = ({
    accountStepDetailsRef,
    disableChange,
    emailDisabled,
    emailReadOnly,
    footer,
    model,
    onSubmit,
    measure,
    passwordFields,
    emailDescription,
    hideEmailLabel = false,
    onFormValidChange,
}: Props) => {
    const {
        state,
        onValue,
        asyncStates,
        getAssistVisible,
        hasSwitchSignupType,
        passwordStrengthIndicatorSpotlight,
        hasConfirmPasswordLabel,
        refs,
        errors,
        inputStates,
        getIsValid,
        getIsValidSync,
        getValidAccountData,
        scrollInto,
    } = useAccountFormDataContext();

    const anchorRef = useRef<HTMLButtonElement | null>(null);
    const passwordContainerRef = useRef<HTMLInputElement>(null);
    const theme = usePublicTheme();
    const [, setRerender] = useState<any>();
    const [loadingChallenge, setLoadingChallenge] = useState(true);

    const variant = useVariant('InboxBringYourOwnEmailSignup');
    const hasAccessToBYOE =
        useFlag('InboxBringYourOwnEmail') &&
        (variant.name === 'Light' || variant.name === 'Bold') &&
        state.signupTypes.has(SignupType.BringYourOwnEmail);

    useImperativeHandle(accountStepDetailsRef, () => ({
        validate: () => {
            return getIsValid({ passwords: passwordFields });
        },
        data: async (): Promise<AccountData> => {
            return getValidAccountData({ passwords: passwordFields });
        },
        scrollInto,
    }));

    const isFormValid = getIsValidSync({ passwords: passwordFields });
    useEffect(
        function reportWhenFormIsValid() {
            onFormValidChange(isFormValid);
        },
        [isFormValid]
    );

    const inputsWrapper = 'flex flex-column';
    const dense = !passwordFields && state.signupTypes.size <= 1;

    const handleSubmit = async () => {
        // Not valid
        if (!onSubmit) {
            return;
        }
        try {
            measure({
                event: TelemetryAccountSignupEvents.userCheckout,
                dimensions: {
                    type: 'free',
                    plan: PLANS.FREE,
                    cycle: `${model.subscriptionData.cycle}`,
                    currency: model.subscriptionData.currency,
                },
            });
            if (await getIsValid({ passwords: passwordFields })) {
                onSubmit();
            }
        } catch {
            // ignore error
        }
    };

    const disableChangeForChallenge = disableChange || loadingChallenge;
    const domainOptions = state.domains.map((DomainName) => ({ text: DomainName, value: DomainName }));

    const byoePasswordLabel = (
        <span>
            {c('Signup label').t`${BRAND_NAME} password`}
            <Info
                className="ml-1"
                buttonClass="align-text-bottom"
                title={c('loc_nightly: BYOE').t`This password is used to login to your ${BRAND_NAME} account`}
            />
        </span>
    );

    return (
        <>
            <form
                ref={refs.form}
                name="account-form"
                onSubmit={async (event) => {
                    event.preventDefault();
                    handleSubmit().catch(noop);
                }}
            >
                {/*This is attempting to position at the same place as the select since it's in the challenge iframe*/}
                <div className="relative">
                    <div
                        ref={anchorRef as any}
                        className="absolute top-custom right-custom"
                        style={{
                            '--right-custom': '6px',
                            '--top-custom': '53px', // Magic values where the select will be
                        }}
                    />
                </div>
                <div className={`${inputsWrapper} mb-4`}>
                    <Challenge
                        getThemeData={getThemeData}
                        getIconsData={() => challengeIconsSvg}
                        bodyClassName="color-norm bg-transparent px-2"
                        iframeClassName="challenge-width-increase"
                        challengeRef={refs.challenge}
                        type={0}
                        hasSizeObserver
                        title={c('Signup label').t`Email address`}
                        name="email"
                        onSuccess={() => {
                            setLoadingChallenge(false);
                        }}
                        onError={() => {
                            setLoadingChallenge(false);
                        }}
                    >
                        <div className={clsx(inputsWrapper, theme.dark && 'ui-prominent', 'bg-transparent')}>
                            {(state.signupType === SignupType.External ||
                                state.signupType === SignupType.BringYourOwnEmail) && (
                                <InputFieldTwo
                                    ref={refs.email}
                                    id="email"
                                    label={hideEmailLabel ? undefined : c('Signup label').t`Email address`}
                                    inputClassName="email-input-field"
                                    error={errors.email}
                                    suffix={(() => {
                                        if (errors.email) {
                                            return undefined;
                                        }
                                        if (asyncStates.email.state === AsyncValidationStateValue.Success) {
                                            return (
                                                <Icon
                                                    name="checkmark-circle"
                                                    className="color-success"
                                                    size={4}
                                                    data-testid="email-valid"
                                                />
                                            );
                                        }
                                        if (
                                            asyncStates.email.state === AsyncValidationStateValue.Loading &&
                                            getAssistVisible('email')
                                        ) {
                                            return <CircleLoader size="small" />;
                                        }
                                    })()}
                                    disabled={emailDisabled}
                                    dense={dense ? !errors.email : undefined}
                                    rootClassName={dense ? (!errors.email ? 'pb-2' : undefined) : undefined}
                                    value={state.email}
                                    onValue={(value) => onValue.onEmailValue(value, state.domains)}
                                    onBlur={() => {
                                        // Doesn't work because it's in the challenge
                                        onValue.onInputsStateDiff({ email: { focus: true } });
                                    }}
                                    onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                                        if (event.key === 'Enter') {
                                            handleSubmit();
                                        }
                                        if (event.key === 'Tab') {
                                            onValue.onInputsStateDiff({ email: { focus: true } });
                                        }
                                    }}
                                    {...(() => {
                                        if (emailReadOnly) {
                                            return { readOnly: emailReadOnly };
                                        }
                                        if (disableChangeForChallenge) {
                                            return { readOnly: true, disableReadOnlyField: true };
                                        }
                                    })()}
                                />
                            )}

                            {state.signupType === SignupType.Proton && (
                                <InputFieldTwo
                                    ref={refs.username}
                                    id="username"
                                    label={c('Signup label').t`Username`}
                                    error={errors.username}
                                    inputClassName="email-input-field"
                                    suffix={(() => {
                                        const asyncState = (() => {
                                            const wrap = (child: ReactNode) => {
                                                return (
                                                    <div
                                                        className="w-custom text-center"
                                                        style={{
                                                            '--w-custom': '1.5rem',
                                                        }}
                                                    >
                                                        {child}
                                                    </div>
                                                );
                                            };
                                            if (asyncStates.username.state === AsyncValidationStateValue.Success) {
                                                return wrap(
                                                    <Icon
                                                        name="checkmark-circle"
                                                        className="color-success"
                                                        size={4}
                                                        data-testid="email-valid"
                                                    />
                                                );
                                            }
                                            if (
                                                asyncStates.username.state === AsyncValidationStateValue.Loading &&
                                                getAssistVisible('username')
                                            ) {
                                                return wrap(<CircleLoader size="small" />);
                                            }
                                        })();

                                        if (domainOptions.length === 1) {
                                            const value = `@${state.domain}`;
                                            return (
                                                <>
                                                    <span className="text-ellipsis" title={value}>
                                                        {value}
                                                    </span>
                                                    {asyncState}
                                                </>
                                            );
                                        }
                                        return (
                                            <>
                                                <SelectTwo
                                                    id="select-domain"
                                                    originalPlacement="bottom-end"
                                                    anchorRef={anchorRef}
                                                    size={{ width: DropdownSizeUnit.Static }}
                                                    unstyled
                                                    onOpen={() => setRerender({})}
                                                    onClose={() => setRerender({})}
                                                    value={state.domain}
                                                    onChange={({ value }) => {
                                                        onValue.onUsernameValue(state.username, value);
                                                    }}
                                                >
                                                    {domainOptions.map((option) => (
                                                        <Option
                                                            key={option.value}
                                                            value={option.value}
                                                            title={option.text}
                                                        >
                                                            @{option.text}
                                                        </Option>
                                                    ))}
                                                </SelectTwo>
                                                {asyncState}
                                            </>
                                        );
                                    })()}
                                    dense={dense ? !errors.username : undefined}
                                    rootClassName={dense ? (!errors.username ? 'pb-2' : undefined) : undefined}
                                    value={state.username}
                                    onValue={(value: string) => {
                                        onValue.onUsernameValue(value, state.domain);
                                    }}
                                    onBlur={() => {
                                        // Doesn't work because it's in the challenge
                                        onValue.onInputsStateDiff({ username: { focus: true } });
                                    }}
                                    onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                                        if (event.key === 'Enter') {
                                            handleSubmit();
                                        }
                                        if (event.key === 'Tab') {
                                            onValue.onInputsStateDiff({ username: { focus: true } });
                                        }
                                    }}
                                    readOnly={disableChangeForChallenge}
                                    disableReadOnlyField={disableChangeForChallenge}
                                />
                            )}
                        </div>
                    </Challenge>

                    {emailDescription && <div className="mb-4">{emailDescription}</div>}

                    {hasSwitchSignupType ? (
                        <div className="text-center">
                            <InlineLinkButton
                                id="existing-email-button"
                                onClick={() => {
                                    const signupType =
                                        state.signupType === SignupType.Proton
                                            ? SignupType.External
                                            : SignupType.Proton;
                                    onValue.onDetailsDiff({ signupType, email: '', username: '' });
                                }}
                            >
                                {state.signupType === SignupType.External
                                    ? c('Action').t`Get a new encrypted email address`
                                    : c('Action').t`Use your current email instead`}
                            </InlineLinkButton>
                            <Info
                                buttonTabIndex={-1}
                                className="ml-2"
                                title={
                                    state.signupType === SignupType.External
                                        ? c('Info')
                                              .t`With an encrypted ${BRAND_NAME} address, you can use all ${BRAND_NAME} services`
                                        : c('Info')
                                              .t`You will need a ${BRAND_NAME} address to use ${MAIL_APP_NAME} and ${CALENDAR_APP_NAME}`
                                }
                            />
                        </div>
                    ) : null}

                    {hasAccessToBYOE && (
                        <BYOESignupButton
                            onEmailValue={(value) => onValue.onEmailValue(value, state.domains)}
                            signupType={state.signupType}
                            setSignupType={(signupType) => onValue.onDetailsDiff({ signupType })}
                            onUseInternalAddress={() =>
                                onValue.onDetailsDiff({ signupType: SignupType.Proton, email: '', username: '' })
                            }
                            passwordInputRef={refs.password}
                        />
                    )}

                    {passwordFields && (
                        <>
                            <PasswordStrengthIndicatorSpotlight
                                wrapper={passwordStrengthIndicatorSpotlight}
                                password={state.password}
                                anchorRef={passwordContainerRef}
                            >
                                <InputFieldTwo
                                    ref={refs.password}
                                    containerRef={passwordContainerRef}
                                    id="password"
                                    as={PasswordInputTwo}
                                    assistiveText={
                                        !passwordStrengthIndicatorSpotlight.supported &&
                                        inputStates.password.focus &&
                                        getMinPasswordLengthMessage()
                                    }
                                    label={
                                        state.signupType === SignupType.BringYourOwnEmail
                                            ? byoePasswordLabel
                                            : c('Signup label').t`Password`
                                    }
                                    error={errors.password}
                                    dense={!errors.password}
                                    rootClassName={clsx(
                                        hasSwitchSignupType ? 'mt-4' : 'mt-2',
                                        !errors.password && 'pb-2'
                                    )}
                                    disableChange={disableChange}
                                    value={state.password}
                                    autoComplete="new-password"
                                    onValue={(value: string) => {
                                        onValue.onDetailsDiff({ password: value });
                                        onValue.onInputsStateDiff({ password: { interactive: true } });
                                    }}
                                    onBlur={() => {
                                        onValue.onInputsStateDiff({ password: { focus: true } });
                                        passwordStrengthIndicatorSpotlight.onInputBlur();
                                    }}
                                    onFocus={passwordStrengthIndicatorSpotlight.onInputFocus}
                                />
                            </PasswordStrengthIndicatorSpotlight>

                            {inputStates.password.interactive && (
                                <InputFieldTwo
                                    ref={refs.passwordConfirm}
                                    id="password-confirm"
                                    as={PasswordInputTwo}
                                    placeholder={
                                        !hasConfirmPasswordLabel ? c('Signup label').t`Confirm password` : undefined
                                    }
                                    label={hasConfirmPasswordLabel && c('Signup label').t`Confirm password`}
                                    error={errors.passwordConfirm}
                                    dense={!errors.passwordConfirm}
                                    rootClassName={clsx(errors.password && 'pt-2')}
                                    disableChange={disableChange}
                                    value={state.passwordConfirm}
                                    autoComplete="new-password"
                                    onValue={(value: string) => {
                                        onValue.onDetailsDiff({ passwordConfirm: value });
                                        onValue.onInputsStateDiff({ passwordConfirm: { interactive: true } });
                                    }}
                                    onBlur={() => {
                                        onValue.onInputsStateDiff({ passwordConfirm: { focus: true } });
                                    }}
                                />
                            )}
                        </>
                    )}
                </div>
                {footer({
                    emailAlreadyUsed: errors.emailAlreadyUsed,
                    email: (() => {
                        if (state.signupType === SignupType.Proton) {
                            if (state.username.trim()) {
                                return joinUsernameDomain(state.username, state.domain);
                            }
                            return '';
                        }
                        return state.email;
                    })(),
                })}
            </form>
        </>
    );
};

export default AccountStepDetails;
