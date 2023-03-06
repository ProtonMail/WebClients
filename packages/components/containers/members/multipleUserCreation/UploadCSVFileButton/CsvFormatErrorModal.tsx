import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalProps, Prompt } from '@proton/components';

const CsvFormatErrorModal = ({ onClose, children, ...rest }: ModalProps) => {
    return (
        <Prompt
            title={c('Title').t`Couldn’t create accounts`}
            buttons={[<Button onClick={onClose}>{c('Action').t`Got it`}</Button>]}
            {...rest}
        >
            {children}
        </Prompt>
    );
};

export default CsvFormatErrorModal;
