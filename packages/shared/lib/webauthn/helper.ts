/**
 * If the browser supports WebAuthn credentials.
 */
export const getHasWebAuthnSupport = () => {
    try {
        return !!navigator?.credentials?.create;
    } catch (e) {
        return false;
    }
};
