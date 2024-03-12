import { updatePassword } from '@proton/shared/lib/api/settings';
import { Api } from '@proton/shared/lib/interfaces';
import { srpVerify } from '@proton/shared/lib/srp';

export const handleChangeLoginPassword = async ({
    api,
    newPassword,
    persistPasswordScope = false,
}: {
    api: Api;
    newPassword: string;
    persistPasswordScope?: boolean;
}) => {
    return srpVerify({
        api,
        credentials: {
            password: newPassword,
        },
        config: updatePassword({ PersistPasswordScope: persistPasswordScope }),
    });
};
