import { c } from 'ttag';

import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import walletNotFoundImg from '@proton/styles/assets/img/illustrations/wallet_not_found.svg';
import clsx from '@proton/utils/clsx';

import { Button } from '../../../atoms';

import './WalletNotFoundErrorDropdown.scss';

interface Props {
    email: string;
    dense?: boolean;
    onSendInvite: (email: string) => void;
}

export const WalletNotFoundErrorContent = ({ email, dense, onSendInvite }: Props) => {
    return (
        <div className="flex flex-column p-6">
            <div className={clsx('flex items-center', dense ? 'flex-row flex-nowrap mb-6' : 'flex-column')}>
                <div className={clsx('shrink-0', dense ? 'mr-4' : 'mb-4')}>
                    <img
                        src={walletNotFoundImg}
                        alt={c('Wallet send')
                            .t`A user icon with an exclamation mark, meaning that something unexpected happened`}
                    />
                </div>
                <div className={clsx('flex flex-column', !dense && 'items-center')}>
                    <span className={clsx('block', dense ? 'text-lg' : 'text-4xl text-semibold text-center')}>{c(
                        'Bitcoin send'
                    ).t`Send invite to ${email}`}</span>
                </div>
            </div>

            {dense && <hr className="m-0" />}

            <p className="my-4 text-center color-hint">
                {c('Bitcoin send')
                    .t`This user may not have a ${WALLET_APP_NAME} integrated with their email yet. Send them an email to tell them you would like to send them bitcoin.`}
            </p>

            <Button
                color="norm"
                shape="solid"
                className={clsx(dense ? 'mt-6' : 'mt-12')}
                fullWidth
                onClick={() => {
                    onSendInvite(email);
                }}
            >{c('Bitcoin send').t`Send invite email`}</Button>
        </div>
    );
};
