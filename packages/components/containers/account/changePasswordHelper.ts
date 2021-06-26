import { srpAuth, srpVerify } from '@proton/shared/lib/srp';
import { unlockPasswordChanges } from '@proton/shared/lib/api/user';
import { updatePassword } from '@proton/shared/lib/api/settings';
import { Api } from '@proton/shared/lib/interfaces';

export const handleUnlock = ({ api, oldPassword, totp }: { api: Api; oldPassword: string; totp?: string }) => {
    return srpAuth({
        api,
        credentials: {
            password: oldPassword,
            totp,
        },
        config: unlockPasswordChanges(),
    });
};

export const handleChangeLoginPassword = async ({ api, newPassword }: { api: Api; newPassword: string }) => {
    return srpVerify({
        api,
        credentials: {
            password: newPassword,
        },
        config: updatePassword(),
    });
};
