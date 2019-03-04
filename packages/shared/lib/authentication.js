import { checkMailboxPassword } from 'pmcrypto';
import { computeKeyPassword } from 'pm-srp';

export const unlock = async (password, { KeySalt, PrivateKey, AccessToken }) => {
    const mailboxPassword = await computeKeyPassword(password, KeySalt);
    const { token } = await checkMailboxPassword(PrivateKey, mailboxPassword, AccessToken);

    return {
        mailboxPassword,
        token
    };
};
