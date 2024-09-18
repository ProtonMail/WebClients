import { Redirect } from 'react-router-dom';

import { useBitcoinBlockchainContext } from '../contexts';

export const EmptyViewContainer = () => {
    const { apiWalletsData } = useBitcoinBlockchainContext();

    if (apiWalletsData?.length) {
        return <Redirect to={`wallets/${apiWalletsData[0].Wallet.ID}`} />;
    }

    return null;
};
