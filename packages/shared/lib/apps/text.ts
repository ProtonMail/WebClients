import { c } from 'ttag';

export const getWelcomeToText = (appName: string) => {
    return c('Onboarding').t`Welcome to ${appName}`;
};
