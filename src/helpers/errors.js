/**
 * Extending Error doesn't work properly with babel. It breaks the instanceof operator.
 * https://github.com/babel/babel/issues/4480
 *
 * @param {String} Name of error
 * @returns {CustomError}
 */
const generateError = (name) => {
    function CustomError(message) {
        this.message = message;
        this.stack = (new Error()).stack;
    }

    CustomError.prototype = Object.create(Error.prototype);
    CustomError.prototype.name = name;
    return CustomError;
};

export const ContactUpdateError = generateError('ContactUpdateError');
export const ContactRemoveError = generateError('ContactRemoveError');
