import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import type { Address, User } from '@proton/shared/lib/interfaces';
import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';
import { getHasMigratedAddressKeys } from '@proton/shared/lib/keys';
import { isPrivate } from '@proton/shared/lib/user/helpers';

export const getIsMnemonicAvailable = ({
    addresses,
    user,
    app,
}: {
    addresses: Address[];
    user: User;
    app: APP_NAMES;
}) => {
    const hasMigratedKeys = getHasMigratedAddressKeys(addresses);
    const isNonPrivateUser = !isPrivate(user);
    return hasMigratedKeys && !isNonPrivateUser && app !== APPS.PROTONVPN_SETTINGS;
};

export const getCanReactiveMnemonic = (user: User) => {
    return (
        user.MnemonicStatus === MNEMONIC_STATUS.PROMPT ||
        user.MnemonicStatus === MNEMONIC_STATUS.ENABLED ||
        user.MnemonicStatus === MNEMONIC_STATUS.OUTDATED
    );
};
