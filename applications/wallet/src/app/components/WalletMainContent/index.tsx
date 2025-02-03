import { useState } from 'react';

import { c } from 'ttag';

import { type WasmApiWalletAccount } from '@proton/andromeda';
import { Dropdown, DropdownCaret, DropdownMenu, DropdownMenuButton, usePopperAnchor } from '@proton/components/index';
import clsx from '@proton/utils/clsx';
import { type IWasmApiWalletData } from '@proton/wallet';

import { useResponsiveContainerContext } from '../../contexts/ResponsiveContainerContext';
import { AddressTableWrapper } from './AddressTableWrapper';
import { TransactionTableWrapper } from './TransactionTableWrapper';

interface Props {
    apiWalletData: IWasmApiWalletData;
    apiAccount?: WasmApiWalletAccount;
    onClickReceive: () => void;
    onClickBuy: () => void;
}

type View = 'transactions' | 'addresses';

const viewToLabel = (view: View) => {
    switch (view) {
        case 'transactions':
            return c('Wallet transactions').t`Transactions`;
        case 'addresses':
            return c('Wallet transactions').t`Addresses`;
    }
};

const VIEWS: View[] = ['transactions', 'addresses'];

export const WalletMainContent = ({ apiWalletData, apiAccount, onClickReceive, onClickBuy }: Props) => {
    const { isNarrow } = useResponsiveContainerContext();
    const [selectedView, setSelectedView] = useState<View>('transactions');

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const viewTitle = (
        <h2 className={clsx('mr-4 text-semibold', isNarrow ? 'text-lg' : 'text-4xl')}>{viewToLabel(selectedView)}</h2>
    );

    const selectorOrTitle = apiAccount ? (
        <>
            <button className="flex flex-row items-center" ref={anchorRef} onClick={toggle}>
                {viewTitle}
                <DropdownCaret className={clsx(['shrink-0 ml-1'])} isOpen={isOpen} />
            </button>

            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close} autoClose={false} autoCloseOutside={false}>
                <DropdownMenu>
                    {VIEWS.map((view) => (
                        <DropdownMenuButton
                            className="text-left"
                            key={view}
                            onClick={() => {
                                setSelectedView(view);
                                close();
                            }}
                        >
                            {viewToLabel(view)}
                        </DropdownMenuButton>
                    ))}
                </DropdownMenu>
            </Dropdown>
        </>
    ) : (
        viewTitle
    );

    if (selectedView === 'addresses' && apiAccount) {
        return (
            <AddressTableWrapper
                selectorOrTitle={selectorOrTitle}
                apiWalletData={apiWalletData}
                apiAccount={apiAccount}
            />
        );
    }

    return (
        <TransactionTableWrapper
            selectorOrTitle={selectorOrTitle}
            apiWalletData={apiWalletData}
            apiAccount={apiAccount}
            onClickReceive={onClickReceive}
            onClickBuy={onClickBuy}
        />
    );
};
