import { checkMailboxPassword, computeKeyPassword } from 'pmcrypto';

export const unlock = async (password, { KeySalt, PrivateKey, AccessToken }) => {
    const mailboxPassword = await computeKeyPassword(password, KeySalt);
    const { token } = await checkMailboxPassword(PrivateKey, mailboxPassword, AccessToken);

    return {
        mailboxPassword,
        token
    };
};
