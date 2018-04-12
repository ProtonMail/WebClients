export const normalizeEmail = (email) => email.toLowerCase();

export const removeEmailAlias = (email = '') => {
    return normalizeEmail(email)
        .replace(/(\+[^@]*)@/, '@')
        .replace(/[._-](?=[^@]*@)/g, '');
};

const id = () => {
    return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .slice(1);
};

/*
 * Generates a contact UID of the form 'proton-web-uuid'
 * @return {String}
 */
export const generateUID = () => {
    return `proton-web-${id()}${id()}-${id()}-${id()}-${id()}-${id()}${id()}${id()}`;
};
