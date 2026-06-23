import type { UserModel } from '@proton/shared/lib/interfaces';
import { getIsSSOAccount } from '@proton/shared/lib/keys';
import type { UnleashClient } from '@proton/unleash/UnleashClient';

export const getIsPasswordReminderAvailable = ({
    unleashClient,
    user,
}: {
    unleashClient: UnleashClient;
    user: UserModel;
}) => {
    const flag = unleashClient.isEnabled('PasswordReminders');

    return flag && user.isPrivate && !getIsSSOAccount(user);
};
