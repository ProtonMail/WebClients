import { c, msgid } from 'ttag';
import { useState, useMemo } from 'react';
import { AlertModal, Button, Checkbox, Label, ModalProps } from '@proton/components';

import { Element } from '../../../models/element';

export interface MoveToSpamModalResolveProps {
    unsubscribe: boolean;
    remember: boolean;
}
interface Props extends ModalProps {
    isMessage: boolean;
    elements: Element[];
    onResolve: ({ unsubscribe, remember }: MoveToSpamModalResolveProps) => void;
    onReject: () => void;
}

const MoveToSpamModal = ({ isMessage, elements, onResolve, onReject, ...rest }: Props) => {
    const [remember, setRemember] = useState(false);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setRemember(e.target.checked);
    const text = useMemo(() => {
        const elementsCount = elements.length;

        if (isMessage) {
            return c('Info').ngettext(
                msgid`This message will be marked as spam. Would like to unsubscribe from it?`,
                `These messages will be marked as spam. Would like to unsubscribe from them?`,
                elementsCount
            );
        }

        return c('Info').ngettext(
            msgid`This conversation will be marked as spam. Would like to unsubscribe from it?`,
            `These conversations will be marked as spam. Would like to unsubscribe from them?`,
            elementsCount
        );
    }, [isMessage, elements]);

    return (
        <AlertModal
            title={c('Title').t`Report spam`}
            buttons={[
                <Button color="norm" onClick={() => onResolve({ unsubscribe: true, remember })}>{c('Action')
                    .t`Unsubscribe and report spam`}</Button>,
                <Button onClick={() => onResolve({ unsubscribe: false, remember })}>{c('Action')
                    .t`Unsubscribe`}</Button>,
                <Button onClick={() => onReject()}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            <p>{text}</p>
            <Label htmlFor="remember-me">
                <Checkbox id="remember-me" checked={remember} onChange={handleChange} />
                {c('Label').t`Remember my choice`}
            </Label>
        </AlertModal>
    );
};

export default MoveToSpamModal;
