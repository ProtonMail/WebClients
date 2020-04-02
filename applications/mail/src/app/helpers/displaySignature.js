import { isAuto, isImported, inSigningPeriod } from '../helpers/message/messages';
import { VERIFICATION_STATUS } from '../constants';

const { SIGNED_AND_INVALID, SIGNED_AND_VALID, NOT_SIGNED } = VERIFICATION_STATUS;

/**
 * Some complicated logic after internal discussions.
 * This function returns whether we should display a lock with check / warning (indicating the signature status)
 * or we just display a lock.
 * The following logic is applied:
 *  1. Old SENT messages (not imported, not autoresponse) are not signed
 *  2. If a SENT message has been correctly verified, a lonesome lock is displayed, unaccompanied by its check
 *      (because we don't consciously do key pinning here)
 *  3. If a SENT message doesn't have a signature, but should have, we display a warning. A SENT message should have a signature if:
 *      - it is not an autoreply AND
 *      - it is not an import AND
 *      - it is send after the time when we started signing all messages
 *  4. If a message fails the signature check, we display a warning
 *  5. If a (non-sent) message has been correctly verified, we display a check.
 *  6. Else we just display the appropriate lock.
 *      - this happens when there is no signature or it hasn't been verified (meaning unverified SENT message fall in this case).
 *  This logic is caused by sent message's signatures always being verified without requiring the user to enable key pinning
 *  (key pinning for your own keys happens as a consequence of our authentication method).
 *  Thus we don't want to display this check for people that don't understand key pinning, but still keep the
 *  same security.
 *  @return {() => boolean} whether to display the signature status
 */
export const displaySignatureStatus = ({ data: message = {}, verified = 0 }) => {
    // TODO: const isSentByMe = message.isSentByMe();
    const isSentByMe = false;

    // Rule 4 + 5 + 6 for non-SENT messages
    if (!isSentByMe) {
        return verified === SIGNED_AND_INVALID || verified === SIGNED_AND_VALID;
    }
    // SENT messages
    const imported = isImported(message.data);
    const auto = isAuto(message.data);
    const period = inSigningPeriod(message.data.Time);
    // Rule 1:
    if (!auto && !imported && !period) {
        return false;
    }
    // Rule 2:
    if (verified === SIGNED_AND_VALID) {
        return false;
    }
    // Rule 3:
    if (verified === NOT_SIGNED && !auto && !imported && period) {
        // warning
        return true;
    }
    // Rule 4 + 6:
    return verified === SIGNED_AND_INVALID;
};
