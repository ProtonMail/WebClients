import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';

import { WalletWithAccountsWithBalanceAndTxs } from '../../types';

interface Props {
    wallet?: WalletWithAccountsWithBalanceAndTxs;
}

export const WelcomeCard = ({ wallet }: Props) => {
    const user = { name: 'Eric' };

    const walletName = wallet ? c('Wallet Dashboard').t`your wallet '${wallet.Name}'` : WALLET_APP_NAME;

    return (
        <Card className="w-full colored-gradient-card ui-prominent flex flex-column py-12" bordered={false} rounded>
            <h2 className="mx-auto text-bold">{c('Wallet Dashboard').t`Welcome ${user.name} 👋`}</h2>
            <p className="max-w-custom mx-auto text-center" style={{ '--max-w-custom': '18rem' }}>{c('Wallet Dashboard')
                .t`Start using ${walletName} by either buying or transfering bitcoins.`}</p>

            <div className="mx-auto mt-2">
                <ButtonLike as={Link} to="/buy" className="ui-standard rounded-full border-none mr-8">{c(
                    'Wallet Dashboard'
                ).t`Buy bitcoins`}</ButtonLike>
                <ButtonLike
                    as={Link}
                    to={wallet ? `/transfer#walletId=${wallet?.WalletID}` : '/transfer'}
                    className="ui-standard rounded-full border-none"
                >{c('Wallet Dashboard').t`Transfer bitcoins`}</ButtonLike>
            </div>
        </Card>
    );
};
