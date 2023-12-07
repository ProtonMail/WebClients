import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';

import { WasmSimpleTransaction } from '../../../pkg';
import { TransactionHistoryOverview } from '../TransactionHistoryOverview';

interface Props {
    transactions: WasmSimpleTransaction[];
    walletId?: number;
}

export const DashboardSideContent = ({ transactions, walletId }: Props) => {
    return (
        <div className="bg-weak py-4 px-6 h-full">
            <div className="flex flex-column items-center">
                <h2 className="h4 text-left w-full text-semibold">{c('Wallet Dashboard').t`Quick actions`}</h2>

                <ButtonLike
                    as={Link}
                    to={walletId ? `/transfer#mode=send&walletId=${walletId}` : '/transfer#mode=send'}
                    size="large"
                    className="w-full mt-3"
                >
                    <Icon name="arrow-up" className="mr-2" /> {c('Wallet Dashboard').t`Send`}
                </ButtonLike>
                <ButtonLike
                    as={Link}
                    to={walletId ? `/transfer#walletId=${walletId}` : '/transfer'}
                    size="large"
                    className="w-full mt-3"
                >
                    <Icon name="arrow-down" className="mr-2" /> {c('Wallet Dashboard').t`Receive`}
                </ButtonLike>
                {/* TODO: connect with swap when ready */}
                <Button size="large" className="w-full mt-3">
                    <Icon name="arrow-right-arrow-left" className="mr-2" /> {c('Wallet Dashboard').t`Swap`}
                </Button>
            </div>

            <hr className="my-10" />

            <div>
                <h2 className="h4 text-left w-full text-semibold">{c('Wallet Dashboard').t`Last transactions`}</h2>
                <TransactionHistoryOverview transactions={transactions} />
            </div>
        </div>
    );
};
