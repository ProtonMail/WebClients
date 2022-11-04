import { APPS, APP_NAMES } from '@proton/shared/lib/constants';
import { Address, MNEMONIC_STATUS, UserModel } from '@proton/shared/lib/interfaces';
import { getHasMigratedAddressKeys } from '@proton/shared/lib/keys';

export const getIsMnemonicAvailable = ({
    addresses,
    user,
    app,
}: {
    addresses: Address[];
    user: UserModel;
    app: APP_NAMES;
}) => {
    const hasMigratedKeys = getHasMigratedAddressKeys(addresses);
    const isNonPrivateUser = !user?.isPrivate;
    return hasMigratedKeys && !isNonPrivateUser && app !== APPS.PROTONVPN_SETTINGS;
};

export const getCanReactiveMnemonic = (user: UserModel) => {
    return (
        user.MnemonicStatus === MNEMONIC_STATUS.PROMPT ||
        user.MnemonicStatus === MNEMONIC_STATUS.ENABLED ||
        user.MnemonicStatus === MNEMONIC_STATUS.OUTDATED
    );
};
