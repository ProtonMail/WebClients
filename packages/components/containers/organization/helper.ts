import { c } from 'ttag';

export const getActivationText = () => {
    return c('Error')
        .t`You must activate your organization keys. Without activation you will not be able to create or access non-private users.`;
};
