import type { UserModel } from '@proton/shared/lib/interfaces';
import type { UnleashClient } from '@proton/unleash/UnleashClient';

export const getIsPasswordReminderAvailable = ({
    unleashClient,
    user,
}: {
    unleashClient: UnleashClient;
    user: UserModel;
}) => {
    const flag = unleashClient.isEnabled('PasswordReminders');

    return flag && user.isPrivate;
};
