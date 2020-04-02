/**
 * Generate a string of four random hex characters
 */
export const randomHexString4 = () => {
    return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
};

/**
 * Generates a contact UID of the form 'proton-web-uuid'
 */
export const generateProtonWebUID = () => {
    const s4 = () => randomHexString4();
    return `proton-web-${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
};
