import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';

import type { SpamItem } from '../Spams.interfaces';

interface Props extends ModalProps {
    item: SpamItem;
    onDelete: () => void;
}

const DeleteSpamModal = ({ item, onDelete, ...rest }: Props) => {
    const { onClose } = rest;
    const name = ('domain' in item ? item.domain : item.email) ?? '';

    const nameElement = (
        <strong className="text-break" key="name">
            {name}
        </strong>
    );

    const text = (() => {
        switch (item.location) {
            case 'BLOCKED':
                // translator: ${nameElement} is an email address or a domain
                return c('Info').jt`${nameElement} will be removed from your block list.`;
            case 'NON_SPAM':
                // translator: ${nameElement} is an email address or a domain
                return c('Info').jt`${nameElement} will be removed from your allow list.`;
            case 'SPAM':
            default:
                // translator: ${nameElement} is an email address or a domain
                return c('Info').jt`${nameElement} will be removed from your spam list.`;
        }
    })();

    return (
        <Prompt
            title={c('Title').t`Delete from list?`}
            buttons={[
                <Button
                    color="danger"
                    onClick={() => {
                        onClose?.();
                        onDelete();
                    }}
                >
                    {c('Action').t`Delete`}
                </Button>,
                <Button autoFocus onClick={onClose}>
                    {c('Action').t`Cancel`}
                </Button>,
            ]}
            {...rest}
        >
            <p className="m-0">{text}</p>
        </Prompt>
    );
};

export default DeleteSpamModal;
