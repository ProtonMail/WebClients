import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import Info from '@proton/components/components/link/Info';
import { BRAND_NAME, CALENDAR_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { SignupType } from '../../../../../signup/interfaces';
import { usePasswordInputInline } from '../../../../containers/password/usePasswordInput';
import useEmailInput from '../../../../containers/username/useEmailInput';
import { useSignup } from '../../../../context/SignupContext';
import { StepHeading } from './StepHeading';

interface Props {
    onSubmit: () => void;
    submitting: boolean;
}

/**
 * Mirrors legacy's generic B2B signup (single-signup-v2/AccountStepDetails.tsx): lets the user
 * keep their existing work email instead of creating a new Proton address. Same copy/placement.
 */
const SwitchSignupType = () => {
    const signup = useSignup();
    const { availableSignupTypes, selectedSignupType, setSignupType, focusEmail } = signup.accountForm;

    if (availableSignupTypes.size <= 1) {
        return null;
    }

    const isExternal = selectedSignupType === SignupType.External;

    const handleSwitchType = () => {
        const signupType = isExternal ? SignupType.Proton : SignupType.External;
        setSignupType(signupType);
        focusEmail(signupType);
    };

    return (
        <div className="text-center">
            <InlineLinkButton id="existing-email-button" onClick={handleSwitchType}>
                {isExternal
                    ? c('Action').t`Get a new encrypted email address`
                    : c('Action').t`Use your current email instead`}
            </InlineLinkButton>
            <Info
                buttonTabIndex={-1}
                className="ml-2"
                title={
                    isExternal
                        ? c('Info').t`With an encrypted ${BRAND_NAME} address, you can use all ${BRAND_NAME} services`
                        : c('Info')
                              .t`You will need a ${BRAND_NAME} address to use ${MAIL_APP_NAME} and ${CALENDAR_APP_NAME}`
                }
            />
        </div>
    );
};

/** No submit button or step of its own — pressing Enter here, or submitting the checkout form below it, both call `onSubmit`. */
const AccountDetailsForm = ({ onSubmit, submitting }: Props) => {
    const signup = useSignup();

    const signIn = (
        <Link key="signin" className="link link-focus text-nowrap" to={signup.loginUrl}>
            {c('Link').t`Sign in`}
        </Link>
    );

    const { emailInput } = useEmailInput({
        autoFocus: true,
        onSubmit,
        loading: submitting,
        // The email input renders inside the challenge iframe, so the 'ui-prominent' wrapper in
        // CheckoutForm can't reach it. Pass it through the hook, which applies it inside the iframe.
        inputClassName: 'ui-prominent',
    });
    const { passwordInputs } = usePasswordInputInline({ loading: submitting });

    return (
        <form
            ref={signup.accountForm.refs.form}
            name="accountForm"
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit();
            }}
            method="post"
            autoComplete="off"
            noValidate
            className="w-full"
        >
            <StepHeading step={1}>{c('Signup').t`Create your ${BRAND_NAME} account`}</StepHeading>

            <div className="mt-4 flex flex-column gap-4">
                {emailInput}
                <SwitchSignupType />
                <div>{passwordInputs}</div>
            </div>

            <div className="mt-4 text-sm color-weak">{c('Go to sign in').jt`Already have an account? ${signIn}`}</div>
        </form>
    );
};

export default AccountDetailsForm;
