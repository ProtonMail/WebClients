import { c } from 'ttag';

import type { ModalOwnProps } from '@proton/components';
import { Prompt } from '@proton/components';
import walletSendingPlane from '@proton/styles/assets/img/wallet/wallet-bitcoin.jpg';

import { Button } from '../../../atoms';
import { ModalParagraph } from '../../../atoms/ModalParagraph';

interface Props extends ModalOwnProps {
    onBuyMoreBitcoin: () => void;
    open: boolean;
    onDone: () => void;
}

export const BitcoinBuyConfirmModal = ({ onBuyMoreBitcoin, open, onDone }: Props) => {
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
                >{c('Buy confirm').t`Buy more bitcoin`}</Button>,
            ]}
        >
            <div className="flex flex-column items-center">
                <img
                    className="h-custom w-custom"
                    src={walletSendingPlane}
                    alt=""
                    style={{ '--w-custom': '15rem', '--h-custom': '10.438rem' }}
                />

                <h1 className="text-bold text-break text-3xl mt-3 mb-4 text-center">
                    {c('Buy confirm').t`Purchase completed`}
                </h1>

                <ModalParagraph>
                    <p>{c('Buy confirm').jt`
                    Thank you for your purchase attempt with our partner.
                    You can track the status of your order via the confirmation email sent to you by our partner.
                    If the transaction fails, you may try again or choose an alternative partner.`}</p>
                    <p>{c('Buy confirm').jt`
                        For any issues with the purchasing process, please contact the partner’s support team.`}</p>
                </ModalParagraph>
            </div>
        </Prompt>
    );
};
