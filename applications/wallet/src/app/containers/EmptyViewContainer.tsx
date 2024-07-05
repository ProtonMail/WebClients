import { Redirect } from 'react-router-dom';

import { useBitcoinBlockchainContext } from '../contexts';

export const EmptyViewContainer = () => {
    const { decryptedApiWalletsData } = useBitcoinBlockchainContext();

    if (decryptedApiWalletsData?.length) {
        return <Redirect to={`wallets/${decryptedApiWalletsData[0].Wallet.ID}`} />;
    }

    return null;
};
