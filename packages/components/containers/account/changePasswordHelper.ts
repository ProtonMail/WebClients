import { updatePassword } from '@proton/shared/lib/api/settings';
import { Api } from '@proton/shared/lib/interfaces';
import { srpVerify } from '@proton/shared/lib/srp';

export const handleChangeLoginPassword = async ({ api, newPassword }: { api: Api; newPassword: string }) => {
    return srpVerify({
        api,
        credentials: {
            password: newPassword,
        },
        config: updatePassword(),
    });
};
