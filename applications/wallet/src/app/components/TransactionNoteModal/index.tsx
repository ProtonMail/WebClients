import { c } from 'ttag';

import type { ModalOwnProps } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import type { IWasmApiWalletData } from '@proton/wallet';

import { TEXT_AREA_MAX_LENGTH } from '../../constants';
import { TextAreaModal } from '../TextAreaModal';
import { useTransactionNoteModal } from './useTransactionNoteModal';

interface Props extends ModalOwnProps {
    hashedTxId: string;
    apiWalletData: IWasmApiWalletData;
}

export const TransactionNoteModal = ({ apiWalletData, hashedTxId, ...modalProps }: Props) => {
    const { baseLabel, handleSaveNote } = useTransactionNoteModal({
        hashedTxId,
        onClose: modalProps.onClose,
        walletKey: apiWalletData.WalletKey?.DecryptedKey,
    });

    const [loading, withLoading] = useLoading();

    return (
        <TextAreaModal
            title={c('Wallet transaction').t`Transaction note`}
            inputLabel={c('Wallet transaction').t`Note to self`}
            buttonText={c('Wallet transaction').t`Save note`}
            value={baseLabel}
            loading={loading}
            onSubmit={(value) => {
                void withLoading(handleSaveNote(value));
            }}
            {...modalProps}
            maxLength={TEXT_AREA_MAX_LENGTH}
        />
    );
};
