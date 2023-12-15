import { useState } from 'react';
import { ContainerGetter, SortEndHandler, arrayMove } from 'react-sortable-hoc';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import {
    Badge,
    OrderableTable,
    OrderableTableBody,
    OrderableTableHeader,
    OrderableTableRow,
    SettingsLink,
} from '@proton/components/components';
import { wait } from '@proton/shared/lib/helpers/promise';
import { WALLET_SETTINGS_ROUTE } from '@proton/shared/lib/wallet';

interface Props {}

// TODO: Connect this to API a5f253e4
const WALLETS: any[] = [
    { kind: 'onchain', name: 'Bitcoin 02', id: 1, priority: 0 },
    { kind: 'onchain', name: 'Bitcoin 01', id: 2, priority: 1 },
    { kind: 'lightning', name: 'Lightning 01', id: 0, priority: 2 },
    { kind: 'onchain', name: 'Bitcoin 03', id: 3, priority: 3 },
    { kind: 'onchain', name: 'Bitcoin 04', id: 4, priority: 4 },
    { kind: 'onchain', name: 'Bitcoin 05', id: 5, priority: 5 },
];

const sWallets = WALLETS.sort(({ priority: priorityA }, { priority: priorityB }) => priorityA - priorityB);

export const WalletsOrderableList = ({}: Props) => {
    const [wallets, setWallets] = useState(
        // wallets should be sorted by priority before
        sWallets
    );

    if (!wallets.length) {
        return null;
    }

    const defaultOnchainWalletId = wallets.find(({ kind }) => kind === 'onchain').id;
    const defaultLightningWalletId = wallets.find(({ kind }) => kind === 'lightning').id;

    const getScrollContainer: ContainerGetter = () => document.querySelector('.main-area') as HTMLElement;

    const onSortEnd: SortEndHandler = async ({ oldIndex, newIndex }) => {
        try {
            const nextWallets: any[] = arrayMove(wallets, oldIndex, newIndex);

            setWallets(nextWallets);

            // todo: send this to server
            // const walletsToSave = nextWallets.map((wallet, index) => ({
            //     ...wallet,
            //     priority: index,
            // }));

            await wait(2000);
        } catch (e: any) {}
    };

    return (
        <OrderableTable
            className="border-none mt-6 border-collapse mt-4 simple-table--has-actions"
            getContainer={getScrollContainer}
            onSortEnd={onSortEnd}
        >
            <OrderableTableHeader>
                <tr>
                    <th scope="col" className="w-custom" style={{ '--w-custom': '5em' }}>
                        <span className="sr-only">{c('Wallet Settings').t`Order`}</span>
                    </th>
                    <th scope="col">{c('Wallet Settings').t`Wallet name`}</th>
                    <th scope="col">{c('Wallet Settings').t`Status`}</th>
                    <th scope="col">{c('Wallet Settings').t`Action`}</th>
                </tr>
            </OrderableTableHeader>
            <OrderableTableBody colSpan={0}>
                {wallets.map((wallet, index) => (
                    <OrderableTableRow
                        index={index}
                        key={`wallet_${wallet.id}_${wallet.priority}`}
                        cells={[
                            <div key="name" className="text-ellipsis max-w-full" title={wallet.name}>
                                {wallet.name}
                            </div>,
                            <div>
                                {wallet.id === defaultLightningWalletId && (
                                    <Badge type="warning">{c('Wallet Settings').t`Default lightning`}</Badge>
                                )}

                                {wallet.id === defaultOnchainWalletId && (
                                    <Badge type="primary">{c('Wallet Settings').t`Default onchain`}</Badge>
                                )}
                            </div>,
                            <ButtonLike
                                color="weak"
                                as={SettingsLink}
                                size="small"
                                path={`${WALLET_SETTINGS_ROUTE.WALLETS}/${wallet.id}`}
                            >
                                {c('Action').t`Settings`}
                            </ButtonLike>,
                        ]}
                    />
                ))}
            </OrderableTableBody>
        </OrderableTable>
    );
};
