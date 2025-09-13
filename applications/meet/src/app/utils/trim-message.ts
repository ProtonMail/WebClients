export const trimMessage = (message: string) => {
    return message.replace(/^\s*\n+|\n+\s*$/g, '').trim();
};
