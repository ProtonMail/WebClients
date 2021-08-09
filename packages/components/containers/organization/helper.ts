import { c } from 'ttag';

export const getActivationText = () => {
    return c('Error')
        .t`You must activate your organization keys. Without activation you will not be able to create new users, add addresses to existing users, or access non-private user accounts.`;
};
