const getSingleArgument = (argument) => {
    // Many flags creates an array, take the last one.
    if (Array.isArray(argument)) {
        const { length, [length - 1]: last, first } = argument;
        return last || first;
    }
    return argument;
};

module.exports = getSingleArgument;
