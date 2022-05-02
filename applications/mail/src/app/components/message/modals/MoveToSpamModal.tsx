import { c, msgid } from 'ttag';
import { AlertModal, Button, ModalProps } from '@proton/components';

import { useMemo } from 'react';
import { Element } from '../../../models/element';

interface Props extends ModalProps {
    isMessage: boolean;
    elements: Element[];
    onResolve: (andUnsubscribe: boolean) => void;
    onReject: () => void;
}

const MoveToSpamModal = ({ isMessage, elements, onResolve, onReject, ...rest }: Props) => {
    const text = useMemo(() => {
        const elementsCount = elements.length;

        if (isMessage) {
            return c('Info').ngettext(
                msgid`If this message contains a newletter, would you like to unsubscribe and stop receiving email?`,
                `If these messages contain newletters, would you like to unsubscribe and stop receiving email?`,
                elementsCount
            );
        }

        return c('Info').ngettext(
            msgid`If this conversation contains a newletter, would you like to unsubscribe and stop receiving email?`,
            `If these conversations contain newletters, would you like to unsubscribe and stop receiving email?`,
            elementsCount
        );
    }, [isMessage, elements]);

    return (
        <AlertModal
            title={c('Title').t`Report spam`}
            buttons={[
                <Button color="norm" onClick={() => onResolve(true)}>{c('Action')
                    .t`Unsubscribe and report spam`}</Button>,
                <Button onClick={() => onResolve(false)}>{c('Action').t`Unsubscribe`}</Button>,
                <Button onClick={() => onReject()}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {text}
        </AlertModal>
    );
};

export default MoveToSpamModal;
