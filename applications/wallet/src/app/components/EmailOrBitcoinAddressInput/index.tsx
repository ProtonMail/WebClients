import type { KeyboardEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import type { WasmNetwork } from '@proton/andromeda';
import { CircleLoader } from '@proton/atoms';
import { Dropdown, DropdownSizeUnit, Icon, Tooltip } from '@proton/components';
import { verticalPopperPlacements } from '@proton/components/components/popper/utils';
import type { Recipient } from '@proton/shared/lib/interfaces';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import type { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import clsx from '@proton/utils/clsx';
import { MAX_RECIPIENTS_PER_TRANSACTIONS } from '@proton/wallet';

import type { InputProps } from '../../atoms';
import { CoreButton, Input } from '../../atoms';
import { PASSWORD_MANAGER_IGNORE_PROPS } from '../../constants';
import type { BtcAddressOrError, RecipientEmailMap } from '../BitcoinSendModal/useEmailAndBtcAddressesMaps';
import { EmailListItem } from '../EmailListItem';
import { QRCodeReaderModal } from '../QRCodeReaderModal';
import { useEmailOrBitcoinAddressInput } from './useEmailOrBitcoinAddressInput';

import './EmailOrBitcoinAddressInput.scss';

export interface RecipientWithBtcAddress extends Recipient {
    btcAddress: { value?: string; error?: string };
}

interface Props extends Omit<InputProps, 'label' | 'value' | 'onChange'> {
    onAddRecipients: (recipients: Recipient[]) => void;
    onRemoveRecipient?: (recipient: Recipient) => void;
    onClickRecipient?: (recipient: Recipient, btcAddress: BtcAddressOrError, index: number) => void;
    recipientEmailMap: RecipientEmailMap;
    contactEmails?: ContactEmail[];
    contactEmailsMap?: SimpleMap<ContactEmail>;
    limit?: number;
    onChange?: (value: string) => void;
    excludedEmails?: string[];
    loading?: boolean;
    network: WasmNetwork;
    fetchedEmailListItemRightNode: ({
        email,
        error,
    }: {
        email: string;
        error?: BtcAddressOrError['error'];
    }) => JSX.Element | null;
}

export const EmailOrBitcoinAddressInput = ({
    contactEmails,
    contactEmailsMap,
    recipientEmailMap,
    limit = 10,
    onChange,
    onAddRecipients,
    onRemoveRecipient,
    onClickRecipient,
    excludedEmails = [],
    network,
    loading,
    disabled,
    fetchedEmailListItemRightNode,
    ...rest
}: Props) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const [cameraPermissionError, setCameraPermissionError] = useState<DOMException['name']>();

    const {
        input,
        setInput,

        setEmailError,
        emailError,

        recipientsWithBtcAddress,

        filteredOptions,

        qrCodeModal,
        setQrCodeModal,

        handleAddRecipientFromSelect,
        handleAddRecipientFromInput,
        handleAddRecipientFromScan,
    } = useEmailOrBitcoinAddressInput({
        contactEmails,
        recipientEmailMap,
        limit,
        onAddRecipients,
        excludedEmails,
        network,
    });

    useEffect(() => {
        inputRef.current?.focus();
    });

    const listContent = useMemo(() => {
        if (recipientsWithBtcAddress?.length) {
            return (
                <ul className="unstyled m-0 w-full">
                    {recipientsWithBtcAddress.map(({ recipient, btcAddress }, index) => {
                        return (
                            <li key={`${recipient.ContactID}-${index}`} title={recipient.Address} className="flex">
                                <EmailListItem
                                    index={index}
                                    address={recipient.Address}
                                    name={recipient.Name}
                                    onClick={() => onClickRecipient?.(recipient, btcAddress, index)}
                                    rightNode={fetchedEmailListItemRightNode({
                                        email: recipient.Address,
                                        error: btcAddress.error,
                                    })}
                                    leftNode={
                                        onRemoveRecipient && (
                                            <CoreButton
                                                shape="ghost"
                                                color="weak"
                                                className="mr-1 shrink-0 rounded-full"
                                                size="small"
                                                icon
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRemoveRecipient(recipient);
                                                }}
                                            >
                                                <Icon name="cross-circle-filled" className="color-primary" size={4} />
                                            </CoreButton>
                                        )
                                    }
                                />
                            </li>
                        );
                    })}
                </ul>
            );
        }

        // TODO: implement this later
        const recentRecipients = [];

        return (
            <>
                <div className="flex flex-row flex-nowrap bg-norm items-center p-4 rounded-lg">
                    <div
                        className="rounded-full bg-weak w-custom h-custom flex mr-4"
                        style={{ '--h-custom': '2.5rem', '--w-custom': '2.5rem' }}
                    >
                        <Icon name="lightbulb" size={5} className="m-auto" />
                    </div>
                    <span className="block color-weak">{c('Wallet send')
                        .t`Try adding an email address to start sending Bitcoin!`}</span>
                </div>

                {recentRecipients.length ? (
                    <span className="block mt-6 color-hint text-sm mb-1">{c('Wallet send').t`Recent recipients`}</span>
                ) : null}
            </>
        );
    }, [fetchedEmailListItemRightNode, onClickRecipient, onRemoveRecipient, recipientsWithBtcAddress]);

    return (
        <>
            <div className="flex flex-column flex-nowrap justify-center w-full grow">
                <div className="mb-4 w-full shrink-0">
                    <Input
                        {...rest}
                        label={c('Bitcoin send').t`To`}
                        placeholder={c('Bitcoin send').t`Recipient email or BTC address`}
                        dense
                        ref={inputRef}
                        autoFocus
                        value={input}
                        disabled={recipientsWithBtcAddress.length >= MAX_RECIPIENTS_PER_TRANSACTIONS || disabled}
                        {...PASSWORD_MANAGER_IGNORE_PROPS}
                        onValue={setInput}
                        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                            setEmailError('');
                            if (event.key === 'Enter') {
                                handleAddRecipientFromInput(input);
                                event.preventDefault();
                            }
                        }}
                        hint={
                            recipientsWithBtcAddress.length >= MAX_RECIPIENTS_PER_TRANSACTIONS &&
                            c('Wallet send')
                                .t`Max recipients per transaction limit reached (${MAX_RECIPIENTS_PER_TRANSACTIONS})`
                        }
                        className={clsx([rest.className])}
                        containerClassName="border"
                        style={rest.style}
                        error={emailError}
                        suffix={
                            !input ? (
                                <Tooltip
                                    title={(() => {
                                        if (cameraPermissionError === 'NotAllowedError') {
                                            return c('Wallet send')
                                                .t`Please grant camera permission to use QRCode scanner`;
                                        }

                                        if (!!cameraPermissionError) {
                                            return c('Wallet send')
                                                .t`Cannot use QRCode scanner. Please check browser compatibility`;
                                        }

                                        return undefined;
                                    })()}
                                >
                                    <div>
                                        <CoreButton
                                            icon
                                            pill
                                            size="small"
                                            shape="ghost"
                                            disabled={!!cameraPermissionError}
                                            onClick={() => {
                                                setQrCodeModal(true);
                                            }}
                                        >
                                            <Icon
                                                className="color-weak"
                                                name="qr-code"
                                                size={5}
                                                alt={c('Bitcoin send').t`Open QR code reader`}
                                            />
                                        </CoreButton>
                                    </div>
                                </Tooltip>
                            ) : (
                                <CoreButton
                                    icon
                                    pill
                                    size="small"
                                    shape="ghost"
                                    onClick={() => {
                                        handleAddRecipientFromInput(input);
                                    }}
                                >
                                    <Icon
                                        className="color-weak"
                                        name="arrow-left-and-down"
                                        size={5}
                                        alt={c('Bitcoin send').t`Add recipient`}
                                    />
                                </CoreButton>
                            )
                        }
                    />
                </div>

                <Dropdown
                    size={{
                        width: DropdownSizeUnit.Anchor,
                        maxHeight: DropdownSizeUnit.Viewport,
                        maxWidth: DropdownSizeUnit.Viewport,
                    }}
                    availablePlacements={verticalPopperPlacements}
                    isOpen={!!filteredOptions.length}
                    anchorRef={inputRef}
                    onFocus={() => {
                        inputRef.current?.focus();
                    }}
                    disableFocusTrap
                >
                    <ul className="unstyled m-0 w-full">
                        {filteredOptions.map(({ chunks, option }, index) => {
                            return (
                                <li key={`${option.key}-${index}`} title={option.label} className="flex dropdown-item">
                                    <EmailListItem
                                        index={index}
                                        chunks={chunks}
                                        name={option.value.Name}
                                        address={option.value.Email}
                                        onClick={() => handleAddRecipientFromSelect(option)}
                                    />
                                </li>
                            );
                        })}
                    </ul>
                </Dropdown>

                <div className="flex flex-column justify-center grow w-full">
                    <div className="grow max-w-full overflow-auto">{listContent}</div>
                    {loading && (
                        <div className="flex my-3 py-8">
                            <CircleLoader className="color-primary mx-auto" />
                        </div>
                    )}
                </div>
            </div>

            <QRCodeReaderModal
                onScan={handleAddRecipientFromScan}
                onError={(name) => {
                    setCameraPermissionError(name);
                }}
                {...qrCodeModal}
            />
        </>
    );
};
