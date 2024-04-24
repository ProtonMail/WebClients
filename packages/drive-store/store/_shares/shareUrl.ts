import { SHARE_GENERATED_PASSWORD_LENGTH } from '@proton/shared/lib/drive/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { SharedURLFlags } from '@proton/shared/lib/interfaces/drive/sharing';

import { replaceLocalURL } from '../../utils/replaceLocalURL';

export const hasCustomPassword = (sharedURL?: { flags?: number }): boolean => {
    return !!sharedURL && hasBit(sharedURL.flags, SharedURLFlags.CustomPassword);
};

export const hasGeneratedPasswordIncluded = (sharedURL?: { flags?: number }): boolean => {
    return !!sharedURL && hasBit(sharedURL.flags, SharedURLFlags.GeneratedPasswordIncluded);
};

export const splitGeneratedAndCustomPassword = (password: string, sharedURL?: { flags?: number }): [string, string] => {
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

export const getSharedLink = (sharedURL?: {
    token: string;
    publicUrl: string;
    password: string;
    flags?: number;
}): string | undefined => {
    if (!sharedURL) {
        return undefined;
    }

    const [generatedPassword] = splitGeneratedAndCustomPassword(sharedURL.password, sharedURL);

    const url = sharedURL.publicUrl
        ? replaceLocalURL(sharedURL.publicUrl)
        : `${window.location.origin}/urls/${sharedURL.token}`;
    return `${url}${generatedPassword !== '' ? `#${generatedPassword}` : ''}`;
};
