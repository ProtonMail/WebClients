import type { MouseEvent } from 'react';

import { c } from 'ttag';

import type { WasmAccount, WasmAddressDetails, WasmApiWalletAccount } from '@proton/andromeda';
import { Tooltip } from '@proton/atoms';
import { Copy, ModalTwo, ModalTwoContent, ModalTwoHeader, useModalState, useNotifications } from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import QRCode from '@proton/components/components/image/QRCode';
import clsx from '@proton/utils/clsx';
import { useUserWalletSettings, useWalletAccountExchangeRate } from '@proton/wallet/store';

import { CoreButtonLike } from '../../../atoms';
import { Price } from '../../../atoms/Price';
import { Skeleton } from '../../../atoms/Skeleton';
import { DataListItem } from '../../DataList';
import { SignMessageModal } from '../../SignMessageModal';

export const IndexDataListItem = ({ address, loading }: { address?: WasmAddressDetails; loading?: boolean }) => {
    return (
        <DataListItem
            bottomNode={
                <Skeleton loading={loading}>
                    <div className="flex items-center">{`${address?.index}`}</div>
                </Skeleton>
            }
        />
    );
};

export const AddressDataListItem = ({
    account,
    address,
    highlighted,
    loading,
    hasMessageSigner,
}: {
    account?: WasmAccount;
    address?: WasmAddressDetails;
    highlighted?: boolean;
    loading?: boolean;
    hasMessageSigner?: boolean;
}) => {
    const { createNotification } = useNotifications();
    const [walletQrCodeModal, setWalletQrCodeModal, renderWalletQrCodeModal] = useModalState();
    const [signMessageModal, setSignMessageModal, renderSignMessageModal] = useModalState();
    const handleOpenQrCode = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setWalletQrCodeModal(true);
    };
    const handleOpenSignMessage = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setSignMessageModal(true);
    };

    return (
        <DataListItem
            bottomNode={
                <Skeleton loading={loading}>
                    <div className={clsx('block text-ellipsis text-monospace', highlighted && 'color-primary')}>
                        {address ? `${address.address}` : 'bc1qplaceholderplaceholderplaceholder'}
                        {highlighted && (
                            <Tooltip title={c('Info').t`This address is for Bitcoin via Email`}>
                                <Icon name="brand-bitcoin" className="ml-2 color-hint" />
                            </Tooltip>
                        )}
                        <Tooltip title={c('Label').t`Show QRCode`}>
                            <CoreButtonLike
                                icon
                                disabled={!address}
                                className={'ml-2'}
                                title={c('Action').t`Show QRCode`}
                                onClick={handleOpenQrCode}
                            >
                                <Icon name="qr-code" className="color-hint" />
                            </CoreButtonLike>
                        </Tooltip>
                        <Copy
                            value={address?.address ?? ''}
                            onCopy={() => {
                                createNotification({ text: c('Address list').t`Address copied` });
                            }}
                            className={'ml-2 color-hint'}
                        />
                        {hasMessageSigner && (
                            <Tooltip title={c('Label').t`Sign message`}>
                                <CoreButtonLike
                                    icon
                                    disabled={!address}
                                    className={'ml-2'}
                                    title={c('Action').t`Sign message`}
                                    onClick={handleOpenSignMessage}
                                >
                                    <Icon name="lock-pen-filled" className="color-hint" />
                                </CoreButtonLike>
                            </Tooltip>
                        )}
                        {renderWalletQrCodeModal && address && (
                            <ModalTwo size={'small'} {...walletQrCodeModal}>
                                <ModalTwoHeader />
                                <ModalTwoContent>
                                    <div className="flex flex-row justify-center">
                                        <span className="block">
                                            <QRCode
                                                data-testid="serialized-payment-info-qrcode"
                                                value={address.address}
                                            />
                                        </span>
                                    </div>
                                </ModalTwoContent>
                            </ModalTwo>
                        )}
                        {renderSignMessageModal && account && address && (
                            <SignMessageModal account={account} address={address.address} {...signMessageModal} />
                        )}
                    </div>
                </Skeleton>
            }
        />
    );
};

export const AddressBalanceDataListItem = ({
    walletAccount,
    address,
    loading,
}: {
    walletAccount?: WasmApiWalletAccount;
    address?: WasmAddressDetails;
    loading?: boolean;
}) => {
    const [settings] = useUserWalletSettings();
    const [exchangeRate] = useWalletAccountExchangeRate(walletAccount);

    const value = address ? address.balance.confirmed + address.balance.trusted_pending : 0;

    return (
        <DataListItem
            bottomNode={
                <Skeleton loading={loading}>
                    <div className="flex items-center">
                        <Price
                            unit={exchangeRate ?? settings.BitcoinUnit}
                            amount={value}
                            withPositiveSign
                            signClassName={value < 0 ? 'color-danger' : 'color-success'}
                            wrapperClassName="items-baseline"
                        />
                    </div>
                </Skeleton>
            }
        />
    );
};

export const AddressStatusDataListItem = ({
    address,
    loading,
}: {
    address?: WasmAddressDetails;
    loading?: boolean;
}) => {
    return (
        <DataListItem
            bottomNode={
                <Skeleton loading={loading}>
                    {(() => {
                        if (address) {
                            const transactionsCount = address.transactions.length;

                            if (transactionsCount > 0) {
                                return <div className="flex items-center">{c('Address list').t`Used`}</div>;
                            }
                        }

                        return <div className="flex items-center">{c('Address list').t`Not used`}</div>;
                    })()}
                </Skeleton>
            }
        />
    );
};

export const CopyAddressDataListItem = ({
    address,
    loading,
}: {
    lastUsedIndex?: number;
    address?: WasmAddressDetails;
    loading?: boolean;
    isInPool?: boolean;
}) => {
    const { createNotification } = useNotifications();

    return (
        <DataListItem
            bottomNode={
                <Skeleton loading={loading}>
                    <Copy
                        value={address?.address ?? ''}
                        onCopy={() => {
                            createNotification({ text: c('Address list').t`Address copied` });
                        }}
                    />
                </Skeleton>
            }
        />
    );
};
