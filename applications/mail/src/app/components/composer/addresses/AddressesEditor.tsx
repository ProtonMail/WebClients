import { useState, MutableRefObject, MouseEvent, useRef } from 'react';
import { c } from 'ttag';
import { Label, generateUID, classnames, Button, Icon, Tooltip } from '@proton/components';
import { Recipient } from '@proton/shared/lib/interfaces/Address';
import { RecipientType } from '../../../models/address';
import { MessageChange } from '../Composer';
import { MessageSendInfo } from '../../../hooks/useSendInfo';
import AddressesInput from './AddressesInput';
import { MessageState } from '../../../logic/messages/messagesTypes';

interface Props {
    message: MessageState;
    messageSendInfo: MessageSendInfo;
    onChange: MessageChange;
    expanded: boolean;
    toggleExpanded: (e: MouseEvent<HTMLButtonElement>) => void;
    inputFocusRefs: {
        to: MutableRefObject<() => void>;
        cc: MutableRefObject<() => void>;
    };
    handleContactModal: (type: RecipientType) => () => Promise<void>;
}

const AddressesEditor = ({
    message,
    messageSendInfo,
    onChange,
    expanded,
    toggleExpanded,
    inputFocusRefs,
    handleContactModal,
}: Props) => {
    const [uid] = useState(generateUID('composer'));

    const toListAnchorRef = useRef<HTMLDivElement>(null);
    const ccListAnchorRef = useRef<HTMLDivElement>(null);
    const bccListAnchorRef = useRef<HTMLDivElement>(null);

    const handleChange = (type: RecipientType) => (value: Partial<Recipient>[]) => {
        onChange({ data: { [type]: value } });
    };

    return (
        <div className="flex flex-column flex-nowrap flex-align-items-start mt0">
            <div className="flex flex-row w100 relative on-mobile-flex-column">
                <Label htmlFor={`to-${uid}`} className="composer-meta-label text-semibold">
                    {c('Title').t`To`}
                </Label>
                <div
                    className={classnames([
                        'flex flex-nowrap field flex-align-items-center flex-nowrap flex-item-fluid composer-to-editor composer-light-field',
                        expanded ? 'composer-editor-expanded' : 'composer-editor-collapsed',
                    ])}
                    ref={toListAnchorRef}
                >
                    <AddressesInput
                        id={`to-${uid}`}
                        recipients={message.data?.ToList}
                        messageSendInfo={messageSendInfo}
                        onChange={handleChange('ToList')}
                        inputFocusRef={inputFocusRefs.to}
                        placeholder={c('Placeholder').t`Email address`}
                        expanded={expanded}
                        dataTestId="composer:to"
                        classname="composer-editor-to"
                        anchorRef={toListAnchorRef}
                    />
                    <span className="flex flex-nowrap flex-item-noshrink on-mobile-max-w33 on-tiny-mobile-max-w50 flex-align-self-start pt0-5 composer-to-ccbcc-buttons sticky-top">
                        <Button
                            color="norm"
                            shape="ghost"
                            size="small"
                            icon
                            title={c('Action').t`Carbon Copy, Blind Carbon Copy`}
                            onClick={toggleExpanded}
                            data-testid="composer:cc-bcc-button"
                            className={classnames([
                                'ml1 composer-addresses-ccbcc text-left text-cut text-no-decoration text-strong relative',
                                expanded && 'is-active',
                            ])}
                        >
                            {c('Action').t`CC BCC`}
                        </Button>
                        <Tooltip title={c('Action').t`Insert contacts`}>
                            <Button
                                type="button"
                                onClick={handleContactModal('ToList')}
                                color="weak"
                                className="pt0-25 pb0-25 flex-item-noshrink"
                                shape="ghost"
                                icon
                                data-testid="composer:to-button"
                            >
                                <Icon name="user-plus" size={16} alt={c('Title').t`To`} />
                            </Button>
                        </Tooltip>
                    </span>
                </div>
            </div>
            {expanded && (
                <>
                    <div className="flex flex-row on-mobile-flex-column w100 mb0" ref={ccListAnchorRef}>
                        <Label
                            htmlFor={`cc-${uid}`}
                            className="composer-meta-label text-semibold"
                            title={c('Label').t`Carbon Copy`}
                        >
                            {c('Title').t`CC`}
                        </Label>
                        <AddressesInput
                            id={`cc-${uid}`}
                            recipients={message.data?.CCList}
                            messageSendInfo={messageSendInfo}
                            onChange={handleChange('CCList')}
                            placeholder={c('Placeholder').t`Email address`}
                            dataTestId="composer:to-cc"
                            inputFocusRef={inputFocusRefs.cc}
                            addContactButton={c('Title').t`CC`}
                            addContactAction={handleContactModal('CCList')}
                            classname="composer-editor-cc"
                            hasLighterFieldDesign
                            anchorRef={ccListAnchorRef}
                        />
                    </div>
                    <div className="flex flex-row on-mobile-flex-column w100" ref={bccListAnchorRef}>
                        <Label
                            htmlFor={`bcc-${uid}`}
                            className="composer-meta-label text-semibold"
                            title={c('Label').t`Blind Carbon Copy`}
                        >
                            {c('Title').t`BCC`}
                        </Label>
                        <AddressesInput
                            id={`bcc-${uid}`}
                            recipients={message.data?.BCCList}
                            messageSendInfo={messageSendInfo}
                            onChange={handleChange('BCCList')}
                            placeholder={c('Placeholder').t`Email address`}
                            dataTestId="composer:to-bcc"
                            addContactButton={c('Title').t`BCC`}
                            addContactAction={handleContactModal('BCCList')}
                            classname="composer-editor-bcc"
                            hasLighterFieldDesign
                            anchorRef={bccListAnchorRef}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default AddressesEditor;
