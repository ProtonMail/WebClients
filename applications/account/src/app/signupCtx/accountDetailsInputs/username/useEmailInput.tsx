import { type KeyboardEvent, type ReactNode, useRef, useState } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { Challenge, DropdownSizeUnit, Icon, InputFieldTwo, Option, SelectTwo } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { usePublicTheme } from '../../../containers/PublicThemeProvider';
import challengeIconsSvg from '../../../signup/challenge-icons.source.svg';
import { getThemeData } from '../../../signup/challenge-theme';
import { SignupType } from '../../../signup/interfaces';
import { useAccountFormDataContext } from '../../context/accountData/AccountFormDataContext';
import { AsyncValidationStateValue } from '../../context/accountData/asyncValidator/createAsyncValidator';

interface Props {
    onSubmit: () => void;
    loading?: boolean;
    autoFocus?: boolean;
    bigger?: boolean;

    emailReadOnly?: boolean;
    emailDisabled?: boolean;
    emailLabelHidden?: boolean;
}

const useEmailInput = ({
    loading,
    onSubmit,
    autoFocus,
    emailDisabled,
    emailReadOnly,
    emailLabelHidden,
    bigger,
}: Props) => {
    const anchorRef = useRef<HTMLButtonElement | null>(null);
    const accountDataContext = useAccountFormDataContext();

    const theme = usePublicTheme();
    const [, setRerender] = useState<any>();

    const [loadingChallenge, setLoadingChallenge] = useState(true);

    const inputsWrapper = 'relative flex flex-column';

    const { refs, state, errors, onValue, asyncStates, getAssistVisible } = accountDataContext;

    const dense = false; //!passwordFields && signupTypes.length <= 1;
    const disableChangeForChallenge = loading || loadingChallenge;

    const domainOptions = state.domains.map((DomainName) => ({ text: DomainName, value: DomainName }));

    const input = (
        <>
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
            <div className={`${inputsWrapper}`}>
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
                        if (autoFocus) {
                            accountDataContext.focusEmail();
                        }
                    }}
                    onError={() => {
                        setLoadingChallenge(false);
                    }}
                >
                    <div className={clsx(inputsWrapper, theme.dark && 'ui-prominent', 'bg-transparent')}>
                        {state.signupType === SignupType.External && (
                            <InputFieldTwo
                                bigger={bigger}
                                ref={refs.email}
                                id="email"
                                label={emailLabelHidden ? undefined : c('Signup label').t`Email address`}
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
                                onValue={(value: string) => onValue.onEmailValue(value, state.domains)}
                                onBlur={() => {
                                    // Doesn't work because it's in the challenge
                                    onValue.onInputsStateDiff({ email: { focus: true } });
                                }}
                                onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                                    if (event.key === 'Enter') {
                                        onSubmit();
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
                                bigger={bigger}
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
                                                    <Option key={option.value} value={option.value} title={option.text}>
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
                                        onSubmit();
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
            </div>
        </>
    );

    return { emailInput: input, loadingChallenge };
};

export default useEmailInput;
