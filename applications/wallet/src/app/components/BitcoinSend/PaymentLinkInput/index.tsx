import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import TextAreaTwo from '@proton/components/components/v2/input/TextArea';

import { WasmPaymentLink } from '../../../../pkg';
import { QRCodeReaderModal } from '../../QRCodeReaderModal';
import { usePaymentLinkInput } from './usePaymentLinkInput';

interface Props {
    onPaymentLinkSubmit: (paymentLink: WasmPaymentLink) => void;
    onCreateTxFromScratch: () => void;
}

export const PaymentLinkInput = ({ onPaymentLinkSubmit, onCreateTxFromScratch }: Props) => {
    const {
        isOpen,
        closeModal,
        openModal,

        paymentLinkInput,
        parsedPaymentLink,
        handleClickPasteButton,
        handleScanQrCode,
        handleTextAreaInputChange,
    } = usePaymentLinkInput();

    return (
        <>
            <div className="py-6 px-8 h-full flex flex-column">
                <div className="mx-8">
                    <TextAreaTwo
                        value={paymentLinkInput}
                        onChange={(event) => handleTextAreaInputChange(event.target.value)}
                        placeholder="bitcoin:"
                    ></TextAreaTwo>
                </div>

                <div className="flex flex-column mt-2 mx-auto">
                    <Button
                        color="norm"
                        disabled={!parsedPaymentLink}
                        onClick={() => {
                            if (parsedPaymentLink) {
                                onPaymentLinkSubmit(parsedPaymentLink);
                            }
                        }}
                    >{c('Wallet Send').t`Next`}</Button>

                    <div className="flex flex-row mt-5">
                        <Button
                            size="large"
                            className="flex flex-row items-center mr-4"
                            onClick={() => {
                                handleClickPasteButton();
                            }}
                        >
                            <Icon size={10} name="note" />{' '}
                            <span className="block ml-2">{c('Wallet Send').t`Paste`}</span>
                        </Button>
                        <Button size="large" className="flex flex-row items-center" onClick={() => openModal()}>
                            <Icon size={10} name="camera" />{' '}
                            <span className="block ml-2">{c('Wallet Send').t`Scan`}</span>
                        </Button>
                    </div>
                </div>

                <Button shape="underline" className="mt-8" onClick={() => onCreateTxFromScratch()}>{c('Wallet Send')
                    .t`Build onchain transaction from scratch`}</Button>
            </div>

            <QRCodeReaderModal
                isOpen={isOpen}
                onClose={closeModal}
                title={c('Wallet Send').t`Scan payment link`}
                onScan={handleScanQrCode}
            />
        </>
    );
};
