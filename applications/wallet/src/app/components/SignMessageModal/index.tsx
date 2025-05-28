import React, { useState } from 'react';

import { c } from 'ttag';

import { type WasmAccount, WasmSigningType } from '@proton/andromeda';
import { Tooltip } from '@proton/atoms';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
    TextAreaTwo,
    useNotifications,
} from '@proton/components';
import type { ModalOwnProps } from '@proton/components/components/modalTwo/Modal';
import type { SelectChangeEvent } from '@proton/components/components/selectTwo/select';
import useLoading from '@proton/hooks/useLoading';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import walletPenDark from '@proton/styles/assets/img/wallet/wallet-pen-dark.png';
import walletPen from '@proton/styles/assets/img/wallet/wallet-pen.png';
import clsx from '@proton/utils/clsx';
import { SIGNING_TYPES } from '@proton/wallet';
import { getWasmMessageSigner } from '@proton/wallet/utils/messageSigner';
import { WalletThemeOption } from '@proton/wallet/utils/theme';

import { Button, Input, Modal, Select } from '../../atoms';
import { ModalParagraph } from '../../atoms/ModalParagraph';
import { ModalSectionHeader } from '../../atoms/ModalSection';
import { getDescriptionBySigningType, getLabelBySigningType } from '../../utils';
import { useWalletTheme } from '../Layout/Theme/WalletThemeProvider';

interface SignMessageModalOwnProps {
    account: WasmAccount;
    address: string;
}

type Props = ModalOwnProps & SignMessageModalOwnProps;

export const SignMessageModal = ({ account, address, ...modalProps }: Props) => {
    const { createNotification } = useNotifications();
    const theme = useWalletTheme();
    const messageSigner = getWasmMessageSigner();
    const [loading, withLoading] = useLoading();
    const [message, setMessage] = useState('');
    const [signature, setSignature] = useState('');
    const [selectedSigningType, setSelectedSigningType] = useState(WasmSigningType.Electrum);

    const signMessage = async () => {
        const signature = await messageSigner.signMessage(account, message, selectedSigningType, address);
        setSignature(signature);
    };

    const onSigningTypeSelect = (event: SelectChangeEvent<WasmSigningType>) => {
        setSelectedSigningType(event.value);
    };

    const copyToClipboard = () => {
        textToClipboard(signature);
        createNotification({
            text: c('Success').t`Signature copied to clipboard`,
        });
    };

    return (
        <Modal size="small" {...modalProps}>
            <div className="flex flex-column items-center">
                <img
                    className="h-custom w-custom"
                    src={theme === WalletThemeOption.WalletDark ? walletPenDark : walletPen}
                    alt=""
                    style={{ '--w-custom': '15rem', '--h-custom': '10.438rem' }}
                />
                <h1 className={clsx('text-bold text-break text-4xl')}>
                    {signature ? c('Sign message').t`Message signed` : c('Sign message').t`Sign a message`}
                </h1>
                {!signature && (
                    <p className="text-break mb-10" style={{ fontWeight: 'var(--font-weight-weak)' }}>
                        {address}
                    </p>
                )}
                {signature && (
                    <p className="mb-10" style={{ fontWeight: 'var(--font-weight-weak)' }}>{c('Sign message')
                        .t`This signature verifies your ownership of this Bitcoin address without revealing your private key.`}</p>
                )}
                <ModalParagraph className="w-full">
                    {signature ? (
                        <Input label={c('Sign message').t`Signature`} value={signature} disabled />
                    ) : (
                        <Input
                            autoFocus
                            as={TextAreaTwo}
                            label={c('Sign message').t`Message`}
                            value={message}
                            onValue={(v: string) => {
                                setMessage(v);
                                setSignature('');
                            }}
                            disabled={loading}
                            placeholder={c('Sign message').t`Enter or paste the message you want to sign.`}
                            style={{ height: '7rem' }}
                            minLength={1}
                            maxlength={500}
                        />
                    )}
                </ModalParagraph>
            </div>

            {!signature && (
                <Collapsible>
                    <CollapsibleHeader
                        className="color-weak"
                        suffix={
                            <CollapsibleHeaderIconButton className="color-weak">
                                <Icon name="chevron-down" />
                            </CollapsibleHeaderIconButton>
                        }
                    >
                        {c('Sign message').t`Advanced settings`}
                    </CollapsibleHeader>
                    <CollapsibleContent>
                        <ModalSectionHeader header={c('Wallet account').t`Signing method`}>
                            <span style={{ fontWeight: 'var(--font-weight-weak)' }}>
                                {c('Sign message')
                                    .t`We default to Electrum signing method because it's the easiest and most common method requested by banks. BIP 137 is used for signing transactions offline and is more advanced.`}
                            </span>
                        </ModalSectionHeader>
                        <Select
                            label={c('Sign message').t`Signing type`}
                            id="signing-type-selector"
                            aria-describedby="label-signing-type"
                            value={selectedSigningType}
                            disabled={loading}
                            onChange={onSigningTypeSelect}
                            options={SIGNING_TYPES.map((opt) => ({
                                label: getLabelBySigningType(opt as WasmSigningType),
                                value: opt,
                                id: opt.toString(),
                                children: (
                                    <div className="flex flex-row items-center py-2">
                                        {getLabelBySigningType(opt as WasmSigningType)}
                                        <Tooltip title={getDescriptionBySigningType(opt as WasmSigningType)}>
                                            <Icon name="info-circle" className="ml-auto color-hint" />
                                        </Tooltip>
                                    </div>
                                ),
                            }))}
                            renderSelected={(selected) => getLabelBySigningType(selected as WasmSigningType)}
                        />
                    </CollapsibleContent>
                </Collapsible>
            )}

            <div className="mt-4 flex flex-col">
                {signature && (
                    <Button fullWidth className="mt-2" shape="solid" color="norm" onClick={() => copyToClipboard()}>{c(
                        'Sign message'
                    ).t`Copy signature`}</Button>
                )}
                {!signature && (
                    <Button
                        disabled={loading || !message}
                        fullWidth
                        className="mt-2"
                        shape="solid"
                        color="norm"
                        onClick={() => withLoading(signMessage)}
                    >{c('Sign message').t`Generate signature`}</Button>
                )}
            </div>
        </Modal>
    );
};
