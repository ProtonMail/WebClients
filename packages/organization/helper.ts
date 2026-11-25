import { c } from 'ttag';

export const getActivationText = () => {
    return c('passwordless')
        .t`To create non-private user accounts and access their accounts, you'll need to activate your organization key.`;
};

export const getReactivationText = () => {
    return c('Error')
        .t`To create non-private user accounts and access their accounts, you'll need to restore your administrator privileges.`;
};
