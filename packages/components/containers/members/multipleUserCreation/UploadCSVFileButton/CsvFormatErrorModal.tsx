import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { AlertModal, ModalProps } from '@proton/components';

const CsvFormatErrorModal = ({ onClose, children, ...rest }: ModalProps) => {
    return (
        <AlertModal
            title={c('Title').t`Couldn’t create accounts`}
            buttons={[<Button onClick={onClose}>{c('Action').t`Got it`}</Button>]}
            {...rest}
        >
            {children}
        </AlertModal>
    );
};

export default CsvFormatErrorModal;
