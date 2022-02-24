import { Address, MNEMONIC_STATUS, UserModel } from '@proton/shared/lib/interfaces';
import { getHasMigratedAddressKeys } from '@proton/shared/lib/keys';
import { APP_NAMES, APPS } from '@proton/shared/lib/constants';

import { Feature } from '../features';

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

export const getShouldOpenMnemonicModal = ({
    user,
    addresses,
    app,
    feature,
}: {
    addresses: Address[];
    user: UserModel;
    app: APP_NAMES;
    feature: Feature<boolean> | undefined;
}) => {
    return (
        getIsMnemonicAvailable({
            addresses,
            user,
            app,
        }) &&
        user?.MnemonicStatus === MNEMONIC_STATUS.PROMPT &&
        feature?.Value === false
    );
};

export const getCanReactiveMnemonic = (user: UserModel) => {
    return (
        user.MnemonicStatus === MNEMONIC_STATUS.PROMPT ||
        user.MnemonicStatus === MNEMONIC_STATUS.ENABLED ||
        user.MnemonicStatus === MNEMONIC_STATUS.OUTDATED
    );
};
