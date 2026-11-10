import { c } from 'ttag';

import { UnlockDeclinedError } from '@proton/pass/utils/errors/errors';

import { PRESENCE_CANCELLED_MESSAGE } from './errors';

/** Renderer side of `assertPresenceVerified`: a dismissed prompt becomes an
 * `UnlockDeclinedError`, any other failure an `Error` with a message to show. */
export const toUnlockError = (err: unknown): never => {
    const message = err instanceof Error ? err.message : '';
    if (message === PRESENCE_CANCELLED_MESSAGE) throw new UnlockDeclinedError();
    throw new Error(message || c('Error').t`Biometric authentication failed`);
};
