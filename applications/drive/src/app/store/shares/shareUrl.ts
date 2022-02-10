import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { SharedURLFlags } from '@proton/shared/lib/interfaces/drive/sharing';
import { SHARE_GENERATED_PASSWORD_LENGTH } from '@proton/shared/lib/drive/constants';

export const hasCustomPassword = (sharedURL?: { Flags?: number }): boolean => {
    return !!sharedURL && hasBit(sharedURL.Flags, SharedURLFlags.CustomPassword);
};

export const hasGeneratedPasswordIncluded = (sharedURL?: { Flags?: number }): boolean => {
    return !!sharedURL && hasBit(sharedURL.Flags, SharedURLFlags.GeneratedPasswordIncluded);
};

export const hasNoCustomPassword = (sharedURL?: { Flags?: number }): boolean => {
    return !hasCustomPassword(sharedURL) && !hasGeneratedPasswordIncluded(sharedURL);
};

export const splitGeneratedAndCustomPassword = (password: string, sharedURL?: { Flags?: number }): [string, string] => {
    if (hasCustomPassword(sharedURL)) {
        if (hasGeneratedPasswordIncluded(sharedURL)) {
            return [
                password.substring(0, SHARE_GENERATED_PASSWORD_LENGTH),
                password.substring(SHARE_GENERATED_PASSWORD_LENGTH),
            ];
        }
        // This is legacy custom password mode; new shares should not create it.
        return ['', password];
    }
    return [password, ''];
};

export const getSharedLink = (sharedURL?: { Token: string; Password: string; Flags?: number }): string | undefined => {
    if (!sharedURL) {
        return undefined;
    }

    const [generatedPassword] = splitGeneratedAndCustomPassword(sharedURL.Password, sharedURL);

    const baseUrl = `${window.location.origin}/urls`;
    return `${baseUrl}/${sharedURL.Token}${generatedPassword !== '' ? `#${generatedPassword}` : ''}`;
};
