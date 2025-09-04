import { c } from 'ttag';

export const getApplicationNameWithPlatform = (name: string, clientID: string) => {
    const lowerCaseClientID = clientID.toLowerCase();

    if (lowerCaseClientID.includes('windows')) {
        return c('Info').t`${name} for Windows`;
    }

    if (lowerCaseClientID.includes('macos')) {
        return c('Info').t`${name} for macOS`;
    }

    if (lowerCaseClientID.includes('linux')) {
        return c('Info').t`${name} for GNU/Linux`;
    }

    if (lowerCaseClientID.includes('ios')) {
        return c('Info').t`${name} for iOS`;
    }

    if (lowerCaseClientID.includes('android')) {
        return c('Info').t`${name} for Android`;
    }

    if (lowerCaseClientID.includes('web')) {
        return c('Info').t`${name} for Web`;
    }

    return name;
};
