import { c } from 'ttag';

import { Href } from '@proton/atoms';
import type { ModalOwnProps } from '@proton/components';
import { Prompt } from '@proton/components';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import walletBitcoinDark from '@proton/styles/assets/img/wallet/wallet-bitcoin-dark.jpg';
import walletBitcoin from '@proton/styles/assets/img/wallet/wallet-bitcoin.jpg';
import { WalletThemeOption } from '@proton/wallet/utils/theme';

import { Button } from '../../../atoms';
import { ModalParagraph } from '../../../atoms/ModalParagraph';
import { useWalletTheme } from '../../Layout/Theme/WalletThemeProvider';

interface Props extends ModalOwnProps {
    onBuyMoreBitcoin: () => void;
    open: boolean;
    onDone: () => void;
}

const support = (
    <Href key="support-link" href="https://proton.me/support/contact?topic=Proton+Wallet">
        {
            // translator: Proton Wallet support
            c('Gateway disclaimer').jt`${WALLET_APP_NAME} support`
        }
    </Href>
);

export const BitcoinBuyInProgressModal = ({ onBuyMoreBitcoin, open, onDone }: Props) => {
    const theme = useWalletTheme();

    return (
        <Prompt
            open={open}
            buttons={[
                <Button
                    fullWidth
                    className="mx-auto"
                    size="large"
                    shape="solid"
                    color="norm"
                    onClick={() => {
                        onDone();
                    }}
                >{c('Gateway disclaimer').t`Done`}</Button>,
                <Button
                    fullWidth
                    className="mx-auto"
                    size="large"
                    shape="solid"
                    color="weak"
                    onClick={() => {
                        onBuyMoreBitcoin();
                    }}
                >{c('Buy in progress').t`Buy more bitcoin`}</Button>,
            ]}
        >
            <div className="flex flex-column items-center">
                <img
                    className="h-custom w-custom"
                    src={theme === WalletThemeOption.WalletDark ? walletBitcoinDark : walletBitcoin}
                    alt=""
                    style={{ '--w-custom': '15rem', '--h-custom': '10.438rem' }}
                />

                <h1 className="text-bold text-break text-3xl mt-3 mb-4 text-center">
                    {c('Buy in progress').t`Purchase in progress`}
                </h1>

                <ModalParagraph>
                    <p>
                        {c('Buy in progress').jt`
                    Thank you for your purchase attempt for an Azteco voucher.
                    As soon as we receive your payment, we will create and redeem the voucher based on BTC price at that time.
                    Then Azteco will send the BTC to your wallet.`}
                    </p>
                    <p>
                        {c('Buy in progress')
                            .jt`For any issues with the purchasing process, please contact ${support}.`}
                    </p>
                </ModalParagraph>
            </div>
        </Prompt>
    );
};
