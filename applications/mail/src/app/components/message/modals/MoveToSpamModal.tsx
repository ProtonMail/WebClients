import { useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { Checkbox, Label, ModalProps, Prompt } from '@proton/components';

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
                msgid`This message will be marked as spam. Would you also like to unsubscribe from future emails?`,
                `These messages will be marked as spam. Would you also like to unsubscribe from future emails?`,
                elementsCount
            );
        }

        return c('Info').ngettext(
            msgid`This conversation will be marked as spam. Would you also like to unsubscribe from future emails?`,
            `These conversations will be marked as spam. Would you also like to unsubscribe from future emails?`,
            elementsCount
        );
    }, [isMessage, elements]);

    return (
        <Prompt
            title={c('Title').t`Move to spam`}
            buttons={[
                <Button color="norm" onClick={() => onResolve({ unsubscribe: true, remember })}>{c('Action')
                    .t`Move to spam and unsubscribe`}</Button>,
                <Button onClick={() => onResolve({ unsubscribe: false, remember })}>{c('Action')
                    .t`Move to spam`}</Button>,
                <Button onClick={() => onReject()}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            <p className="mb-8">{text}</p>
            <Label htmlFor="remember-me" className="inline-flex w-auto">
                <Checkbox id="remember-me" checked={remember} onChange={handleChange} className="mr-2" />
                {c('Label').t`Remember my choice`}
            </Label>
        </Prompt>
    );
};

export default MoveToSpamModal;
