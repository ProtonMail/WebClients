/** Only the message of an error thrown in the main process survives IPC. A prompt
 * dismissed by the user travels as this message, any other failure keeps its own. */
export const PRESENCE_CANCELLED_MESSAGE = 'PRESENCE_CANCELLED';

export const assertPresenceVerified = (verified: boolean) => {
    if (!verified) throw new Error(PRESENCE_CANCELLED_MESSAGE);
};
