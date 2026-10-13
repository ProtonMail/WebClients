import { SHARE_GENERATED_PASSWORD_LENGTH } from '@proton/shared/lib/drive/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { SharedURLFlags } from '@proton/shared/lib/interfaces/drive/sharing';

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
