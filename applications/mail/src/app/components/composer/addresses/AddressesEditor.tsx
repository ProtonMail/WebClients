import type { MouseEvent, MutableRefObject } from 'react';
import { useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Label, Tooltip } from '@proton/components';
import type { Recipient } from '@proton/shared/lib/interfaces/Address';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';

import type { MessageSendInfo } from '../../../hooks/useSendInfo';
import type { RecipientType } from '../../../models/address';
import { selectComposer } from '../../../store/composers/composerSelectors';
import { composerActions } from '../../../store/composers/composersSlice';
import AddressesCCButton from './AddressesCCButton';
import AddressesInput from './AddressesInput';

interface Props {
    composerID: string;
    messageSendInfo: MessageSendInfo;
    ccExpanded: boolean;
    bccExpanded: boolean;
    toggleExpanded: (type: RecipientType) => (e: MouseEvent<HTMLButtonElement>) => void;
    inputFocusRefs: {
        to: MutableRefObject<() => void>;
        cc: MutableRefObject<() => void>;
        bcc: MutableRefObject<() => void>;
    };
    handleContactModal: (type: RecipientType) => () => Promise<void>;
}

const AddressesEditor = ({
    composerID,
    messageSendInfo,
    inputFocusRefs,
    handleContactModal,
    ccExpanded,
    bccExpanded,
    toggleExpanded,
}: Props) => {
    const [uid] = useState(generateUID('composer'));
    const composer = useMailSelector((store) => selectComposer(store, composerID));
    const expanded = ccExpanded || bccExpanded;
    const dispatch = useMailDispatch();

    const toListAnchorRef = useRef<HTMLDivElement>(null);
    const ccListAnchorRef = useRef<HTMLDivElement>(null);
    const bccListAnchorRef = useRef<HTMLDivElement>(null);

    const handleChange = (type: RecipientType) => (recipients: Recipient[]) => {
        dispatch(composerActions.setRecipients({ ID: composerID, type, recipients }));
    };

    return (
        <div className="flex flex-column flex-nowrap items-start mt-0">
            <div className="flex flex-row w-full relative flex-column md:flex-row" data-testid="composer:to-field">
                <Label htmlFor={`to-${uid}`} className="composer-meta-label sr-only text-semibold">
                    {c('Title').t`To`}
                </Label>
                <div
                    className={clsx([
                        'flex flex-nowrap field items-center flex-nowrap md:flex-1 w-full composer-to-editor composer-light-field',
                        expanded ? 'composer-editor-expanded' : 'composer-editor-collapsed',
                    ])}
                    ref={toListAnchorRef}
                >
                    <AddressesInput
                        id={`to-${uid}`}
                        recipients={composer.recipients.ToList}
                        messageSendInfo={messageSendInfo}
                        onChange={handleChange('ToList')}
                        inputFocusRef={inputFocusRefs.to}
                        placeholder={c('Title').t`To`}
                        expanded={expanded}
                        dataTestId="composer:to"
                        classname="composer-editor-to flex-1"
                        anchorRef={toListAnchorRef}
                    />
                    <span className="flex *:min-size-auto flex-nowrap shrink-0 max-w-1/2 sm:max-w-1/3 md:max-w-none self-start pt-2 composer-to-ccbcc-buttons sticky top-0">
                        <>
                            {!ccExpanded && (
                                <AddressesCCButton
                                    classNames="ml-4 composer-addresses-ccbcc text-cut"
                                    onClick={toggleExpanded('CCList')}
                                    type="CCList"
                                />
                            )}
                            {!bccExpanded && (
                                <AddressesCCButton
                                    classNames={clsx(ccExpanded && 'ml-4', 'composer-addresses-ccbcc text-cut')}
                                    onClick={toggleExpanded('BCCList')}
                                    type="BCCList"
                                />
                            )}
                        </>
                        <Tooltip title={c('Action').t`Insert contacts`}>
                            <Button
                                type="button"
                                tabIndex={-1}
                                onClick={handleContactModal('ToList')}
                                color="weak"
                                className="py-2 shrink-0 composer-addresses-to-contact-button"
                                shape="ghost"
                                icon
                                data-testid="composer:to-button"
                            >
                                <Icon name="user-plus" size={4} alt={c('Title').t`To`} />
                            </Button>
                        </Tooltip>
                    </span>
                </div>
            </div>
            {expanded && (
                <>
                    {ccExpanded && (
                        <div
                            className="flex flex-row flex-column md:flex-row w-full mb-0"
                            ref={ccListAnchorRef}
                            data-testid="composer:cc-field"
                        >
                            <Label
                                htmlFor={`cc-${uid}`}
                                className="composer-meta-label sr-only text-semibold"
                                title={c('Label').t`Carbon Copy`}
                            >
                                {c('Title').t`CC`}
                            </Label>
                            <AddressesInput
                                id={`cc-${uid}`}
                                recipients={composer.recipients.CCList}
                                messageSendInfo={messageSendInfo}
                                onChange={handleChange('CCList')}
                                placeholder={c('Title').t`CC`}
                                dataTestId="composer:to-cc"
                                inputFocusRef={inputFocusRefs.cc}
                                addContactButton={c('Title').t`CC`}
                                addContactAction={handleContactModal('CCList')}
                                classname="composer-editor-cc md:flex-1"
                                hasLighterFieldDesign
                                anchorRef={ccListAnchorRef}
                            />
                        </div>
                    )}
                    {bccExpanded && (
                        <div
                            className="flex flex-row flex-column md:flex-row w-full"
                            ref={bccListAnchorRef}
                            data-testid="composer:bcc-field"
                        >
                            <Label
                                htmlFor={`bcc-${uid}`}
                                className="composer-meta-label sr-only text-semibold"
                                title={c('Label').t`Blind Carbon Copy`}
                            >
                                {c('Title').t`BCC`}
                            </Label>
                            <AddressesInput
                                id={`bcc-${uid}`}
                                recipients={composer.recipients.BCCList}
                                messageSendInfo={messageSendInfo}
                                onChange={handleChange('BCCList')}
                                placeholder={c('Title').t`BCC`}
                                dataTestId="composer:to-bcc"
                                addContactButton={c('Title').t`BCC`}
                                inputFocusRef={inputFocusRefs.bcc}
                                addContactAction={handleContactModal('BCCList')}
                                classname="composer-editor-bcc md:flex-1"
                                hasLighterFieldDesign
                                anchorRef={bccListAnchorRef}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AddressesEditor;
