import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import type { ModalProps } from '../../../../components/modalTwo/Modal';
import Prompt from '../../../../components/prompt/Prompt';

const CsvFormatErrorModal = ({ children, ...rest }: ModalProps) => {
    return (
        <Prompt
            title={c('Title').t`Couldn’t create accounts`}
            buttons={[<Button onClick={rest.onClose}>{c('Action').t`Got it`}</Button>]}
            {...rest}
        >
            {children}
        </Prompt>
    );
};

export default CsvFormatErrorModal;
