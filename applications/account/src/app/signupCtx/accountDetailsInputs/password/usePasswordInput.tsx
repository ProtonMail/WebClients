import { useRef } from 'react';

import { c } from 'ttag';

import { InputFieldTwo, PasswordInputTwo } from '@proton/components';
import PasswordStrengthIndicator from '@proton/components/components/passwordStrengthIndicator/PasswordStrengthIndicator';
import { getMinPasswordLengthMessage } from '@proton/shared/lib/helpers/formValidators';
import clsx from '@proton/utils/clsx';

import PasswordStrengthIndicatorSpotlight from '../../../signup/PasswordStrengthIndicatorSpotlight';
import { useAccountFormDataContext } from '../../context/accountData/AccountFormDataContext';

interface Props {
    autoFocus?: boolean;
    loading?: boolean;
    bigger?: boolean;
}

export const usePasswordInputSpotlight = ({ autoFocus, loading, bigger }: Props) => {
    const { passwordStrengthIndicatorSpotlight, refs, state, inputStates, errors, onValue, hasConfirmPasswordLabel } =
        useAccountFormDataContext();
    const passwordContainerRef = useRef<HTMLInputElement>(null);
    const disableChange = loading;

    const passwordInputs = (
        <>
            <PasswordStrengthIndicatorSpotlight
                wrapper={passwordStrengthIndicatorSpotlight}
                password={state.password}
                anchorRef={passwordContainerRef}
            >
                <InputFieldTwo
                    bigger={bigger}
                    ref={refs.password}
                    containerRef={passwordContainerRef}
                    id="password"
                    autoFocus={autoFocus}
                    as={PasswordInputTwo}
                    assistiveText={
                        !passwordStrengthIndicatorSpotlight.supported &&
                        inputStates.password.focus &&
                        getMinPasswordLengthMessage()
                    }
                    label={c('Signup label').t`Password`}
                    error={errors.password}
                    dense={!errors.password}
                    rootClassName={clsx('mt-2', !errors.password && 'pb-2')}
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
                    bigger={bigger}
                    ref={refs.passwordConfirm}
                    id="password-confirm"
                    as={PasswordInputTwo}
                    placeholder={!hasConfirmPasswordLabel ? c('Signup label').t`Confirm password` : undefined}
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
    );

    return { passwordInputs };
};

export const usePasswordInputInline = ({ autoFocus, loading, bigger }: Props) => {
    const { passwordStrengthIndicatorSpotlight, refs, state, inputStates, errors, onValue, hasConfirmPasswordLabel } =
        useAccountFormDataContext();
    const disableChange = loading;

    const passwordInputs = (
        <>
            <InputFieldTwo
                bigger={bigger}
                ref={refs.password}
                id="password"
                autoFocus={autoFocus}
                as={PasswordInputTwo}
                label={c('Signup label').t`Password`}
                error={errors.password}
                rootClassName={clsx('mt-2', !errors.password && 'pb-2')}
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
                assistiveText={
                    passwordStrengthIndicatorSpotlight.supported ? (
                        <PasswordStrengthIndicator
                            service={passwordStrengthIndicatorSpotlight.service}
                            password={state.password}
                            variant="bars"
                            showIllustration={false}
                        />
                    ) : (
                        inputStates.password.focus && getMinPasswordLengthMessage()
                    )
                }
                hint={
                    passwordStrengthIndicatorSpotlight.supported && (
                        <PasswordStrengthIndicator
                            service={passwordStrengthIndicatorSpotlight.service}
                            password={state.password}
                            variant="strengthValueText"
                        />
                    )
                }
            />

            <InputFieldTwo
                bigger={bigger}
                ref={refs.passwordConfirm}
                id="password-confirm"
                as={PasswordInputTwo}
                placeholder={!hasConfirmPasswordLabel ? c('Signup label').t`Confirm password` : undefined}
                label={hasConfirmPasswordLabel && c('Signup label').t`Confirm password`}
                error={errors.passwordConfirm}
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
        </>
    );

    return { passwordInputs };
};
