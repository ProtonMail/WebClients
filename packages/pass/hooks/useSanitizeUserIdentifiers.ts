import { validateEmailAddress } from '@proton/shared/lib/helpers/email';

type Props = { itemEmail: string; itemUsername: string };

export const useSanitizeUserIdentifiers = ({ itemEmail, itemUsername }: Props) => {
    const validEmail = validateEmailAddress(itemEmail);
    const emailUsername = validateEmailAddress(itemUsername);

    if (itemUsername) {
        /* `itemEmail` is empty and `itemUsername` is a valid email: Move username to email field */
        if (!itemEmail && emailUsername) return { itemEmail: itemUsername, itemUsername: '' };
        /* `itemEmail` is invalid but `itemUsername` is a valid email: Swap email and username */
        if (!validEmail && emailUsername) return { itemEmail: itemUsername, itemUsername: itemEmail };
        /* All other cases, return in-place */
        return { itemEmail, itemUsername };
    }

    /* If `itemEmail` is valid, keep it; otherwise, move it to username field */
    return validEmail ? { itemEmail, itemUsername: '' } : { itemEmail: '', itemUsername: itemEmail };
};
