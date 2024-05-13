import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { ModalPropsWithData, TextAreaTwo } from '@proton/components/components';

import { Button, Input, Modal } from '../../atoms';
import { TransactionData } from '../../hooks/useWalletTransactions';

interface Props extends ModalPropsWithData<{ transaction: TransactionData }> {
    onUpdateLabel: (label: string, tx: TransactionData) => void;
}

export const TransactionNoteModal = ({ onUpdateLabel, data, ...modalProps }: Props) => {
    const baseLabel = data?.transaction.apiData?.Label ?? '';
    const [label, setLabel] = useState('');

    useEffect(() => {
        setLabel(baseLabel);
    }, [baseLabel]);

    return (
        <Modal title={c('Wallet transaction').t`Transaction note`} {...modalProps}>
            <Input as={TextAreaTwo} rows={3} label="Note to self" value={label} onValue={(v: string) => setLabel(v)} />

            <Button
                color="norm"
                shape="solid"
                className="mt-6"
                fullWidth
                pill
                disabled={label === baseLabel}
                onClick={() => {
                    if (data?.transaction) {
                        onUpdateLabel(label, data.transaction);
                    }
                }}
            >
                {c('Wallet transaction').t`Save note`}
            </Button>
        </Modal>
    );
};
