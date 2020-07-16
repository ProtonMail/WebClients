import { SignupModel } from '../interfaces';
import { c } from 'ttag';
import { validateEmailAddress } from 'proton-shared/lib/helpers/string';

const getSignupErrors = (model: SignupModel, usernameError: string) => {
    return {
        username: !model.username ? c('Signup error').t`This field is required` : usernameError,
        email: model.email
            ? validateEmailAddress(model.email)
                ? ''
                : c('Signup error').t`Email address invalid`
            : c('Signup error').t`This field is required`,
        password: model.password ? '' : c('Signup error').t`This field is required`,
        confirmPassword: model.confirmPassword
            ? model.password !== model.confirmPassword
                ? c('Signup error').t`Passwords do not match`
                : ''
            : c('Signup error').t`This field is required`,
        recoveryEmail: model.recoveryEmail
            ? validateEmailAddress(model.recoveryEmail)
                ? ''
                : c('Signup error').t`Email address invalid`
            : c('Signup error').t`This field is required`,
        recoveryPhone: model.recoveryPhone ? '' : c('Signup error').t`This field is required`,
        verificationCode: model.verificationCode ? '' : c('Signup error').t`This field is required`
    };
};

export default getSignupErrors;
