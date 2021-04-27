import React, { useState, MutableRefObject, MouseEvent } from 'react';
import { c } from 'ttag';
import {
    Label,
    generateUID,
    LinkButton,
    classnames,
    Tooltip,
    ContactListModal,
    useModals,
    InlineLinkButton,
} from 'react-components';
import { Recipient } from 'proton-shared/lib/interfaces/Address';
import { MessageExtended } from '../../../models/message';
import { RecipientType } from '../../../models/address';
import { MessageChange } from '../Composer';
import { MessageSendInfo } from '../../../hooks/useSendInfo';
import AddressesInput from './AddressesInput';

interface Props {
    message: MessageExtended;
    messageSendInfo: MessageSendInfo;
    onChange: MessageChange;
    expanded: boolean;
    toggleExpanded: (e: MouseEvent<HTMLButtonElement>) => void;
    inputFocusRefs: {
        to: MutableRefObject<() => void>;
        cc: MutableRefObject<() => void>;
    };
}

const AddressesEditor = ({ message, messageSendInfo, onChange, expanded, toggleExpanded, inputFocusRefs }: Props) => {
    const [uid] = useState(generateUID('composer'));
    const { createModal } = useModals();

    const handleChange = (type: RecipientType) => (value: Partial<Recipient>[]) => {
        onChange({ data: { [type]: value } });
    };

    const handleContactModal = (type: RecipientType) => async () => {
        const recipients: Recipient[] = await new Promise((resolve, reject) => {
            createModal(<ContactListModal onSubmit={resolve} onClose={reject} inputValue={message.data?.[type]} />);
        });

        const currentRecipients = message.data && message.data[type] ? message.data[type] : [];
        // the contacts being handled in the modal
        const currentNonContacts = currentRecipients.filter((r) => !r.ContactID);

        onChange({ data: { [type]: [...currentNonContacts, ...recipients] } });
    };

    return (
        <div className="flex flex-column flex-nowrap flex-align-items-start m0-5 pl0-5 pr0-5">
            <div className={classnames(['flex flex-row w100 relative', expanded && 'mb0-5'])}>
                <Label htmlFor={`to-${uid}`} className="composer-meta-label text-bold">
                    <Tooltip title={c('Title').t`Add contacts`}>
                        <InlineLinkButton onClick={handleContactModal('ToList')} data-testid="composer:to-button">
                            {c('Title').t`To`}
                        </InlineLinkButton>
                    </Tooltip>
                </Label>
                <AddressesInput
                    id={`to-${uid}`}
                    recipients={message.data?.ToList}
                    messageSendInfo={messageSendInfo}
                    onChange={handleChange('ToList')}
                    inputFocusRef={inputFocusRefs.to}
                    placeholder={c('Placeholder').t`Email address`}
                    expanded={expanded}
                />
                {!expanded && (
                    <LinkButton
                        className="composer-addresses-ccbcc text-no-decoration text-strong"
                        title={c('Action').t`Carbon Copy, Blind Carbon Copy`}
                        onClick={toggleExpanded}
                        data-testid="composer:cc-bcc-button"
                    >
                        {c('Action').t`CC, BCC`}
                    </LinkButton>
                )}
            </div>
            {expanded && (
                <>
                    <div className="flex flex-row w100 mb0-5">
                        <Label
                            htmlFor={`cc-${uid}`}
                            className="composer-meta-label text-bold"
                            title={c('Label').t`Carbon Copy`}
                        >
                            <Tooltip title={c('Title').t`Add contacts`}>
                                <InlineLinkButton onClick={handleContactModal('CCList')}>
                                    {c('Title').t`CC`}
                                </InlineLinkButton>
                            </Tooltip>
                        </Label>
                        <AddressesInput
                            id={`cc-${uid}`}
                            recipients={message.data?.CCList}
                            messageSendInfo={messageSendInfo}
                            onChange={handleChange('CCList')}
                            placeholder={c('Placeholder').t`Email address`}
                            data-testid="composer:cc"
                            inputFocusRef={inputFocusRefs.cc}
                        />
                    </div>
                    <div className="flex flex-row w100">
                        <Label
                            htmlFor={`bcc-${uid}`}
                            className="composer-meta-label text-bold"
                            title={c('Label').t`Blind Carbon Copy`}
                        >
                            <Tooltip title={c('Title').t`Add contacts`}>
                                <InlineLinkButton onClick={handleContactModal('BCCList')}>
                                    {c('Title').t`BCC`}
                                </InlineLinkButton>
                            </Tooltip>
                        </Label>
                        <AddressesInput
                            id={`bcc-${uid}`}
                            recipients={message.data?.BCCList}
                            messageSendInfo={messageSendInfo}
                            onChange={handleChange('BCCList')}
                            placeholder={c('Placeholder').t`Email address`}
                            data-testid="composer:bcc"
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default AddressesEditor;
