import { useEffect, useState } from 'react';
import { ContainerGetter, SortEndHandler, arrayMove } from 'react-sortable-hoc';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader';
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
import { IWasmApiWalletData, WalletType, useApiWalletsData } from '@proton/wallet';

interface Props {}

export const WalletsOrderableList = ({}: Props) => {
    const [tmpWallets, setTmpWallets] = useState<IWasmApiWalletData[]>([]);

    const [wallets, loadingWallets] = useApiWalletsData();

    useEffect(() => {
        const cloned = [...(wallets ?? [])];
        cloned.sort((a, b) => a.Wallet.Priority - b.Wallet.Priority);
        return setTmpWallets(cloned);
    }, [wallets]);

    if (loadingWallets) {
        return <CircleLoader />;
    }

    if (!tmpWallets.length) {
        return null;
    }

    const defaultOnchainWalletId = tmpWallets.find((data) => data.Wallet.Type === WalletType.OnChain)?.Wallet.ID;
    const defaultLightningWalletId = tmpWallets.find((data) => data.Wallet.Type === WalletType.Lightning)?.Wallet.ID;

    const getScrollContainer: ContainerGetter = () => document.querySelector('.main-area') as HTMLElement;

    const onSortEnd: SortEndHandler = async ({ oldIndex, newIndex }) => {
        try {
            const nextWallets: any[] = arrayMove(tmpWallets, oldIndex, newIndex);

            setTmpWallets(nextWallets);

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
                {tmpWallets.map((wallet, index) => (
                    <OrderableTableRow
                        index={index}
                        key={`wallet_${wallet.Wallet.ID}_${wallet.Wallet.Priority}`}
                        cells={[
                            <div key="name" className="text-ellipsis max-w-full" title={wallet.Wallet.Name}>
                                {wallet.Wallet.Name}
                            </div>,
                            <div>
                                {wallet.Wallet.ID === defaultLightningWalletId && (
                                    <Badge type="warning">{c('Wallet Settings').t`Default lightning`}</Badge>
                                )}

                                {wallet.Wallet.ID === defaultOnchainWalletId && (
                                    <Badge type="primary">{c('Wallet Settings').t`Default onchain`}</Badge>
                                )}
                            </div>,
                            <ButtonLike
                                color="weak"
                                as={SettingsLink}
                                size="small"
                                path={`${WALLET_SETTINGS_ROUTE.WALLETS}/${wallet.Wallet.ID}`}
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
