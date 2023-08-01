import { c } from 'ttag';

export interface Parameters {
    title: string;
    description: string;
}

export const getLoginTitle = (appName: string) => {
    return c('Metadata title').t`${appName}: Sign-in`;
};
export const getLoginDescription = (appName: string) => {
    return c('Metadata title').t`Sign in to access your ${appName} account`;
};

export const getSignupTitle = (appName: string) => {
    return c('Metadata title').t`${appName}: Sign-up`;
};

export const getSignupDescription = (appName: string) => {
    return c('Metadata title').t`Create a new ${appName} account`;
};
