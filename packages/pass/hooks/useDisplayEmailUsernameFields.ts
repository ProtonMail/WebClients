import { validateEmailAddress } from '@proton/shared/lib/helpers/email';

type Props = { itemEmail: string; itemUsername: string };

/** Handle username & email display taking into account users coming from
 * ContentFormatVersion < 5: itemEmail may be an invalid email and should be
 * displayed as username, unless itemUsername already exists */
export const useDisplayEmailUsernameFields = ({ itemEmail, itemUsername }: Props) => {
    /* If the item already has an `itemUsername` - return in-place */
    if (itemUsername) return { emailDisplay: itemEmail, usernameDisplay: itemUsername };

    /* Else validate the `itemEmail` and display it accordingly */
    return validateEmailAddress(itemEmail)
        ? { emailDisplay: itemEmail, usernameDisplay: '' }
        : { emailDisplay: '', usernameDisplay: itemEmail };
};
