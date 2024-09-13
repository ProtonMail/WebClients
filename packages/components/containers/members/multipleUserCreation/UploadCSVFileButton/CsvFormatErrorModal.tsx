import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import Prompt from '@proton/components/components/prompt/Prompt';

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
