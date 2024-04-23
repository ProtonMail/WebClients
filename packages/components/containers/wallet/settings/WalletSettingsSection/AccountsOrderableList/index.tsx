import { useEffect, useMemo, useState } from 'react';
import { ContainerGetter, SortEndHandler, arrayMove } from 'react-sortable-hoc';

import { c, msgid } from 'ttag';

import { WasmApiWalletAccount } from '@proton/andromeda';
import { Button } from '@proton/atoms/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Input } from '@proton/atoms/Input';
import {
    Badge,
    OrderableTable,
    OrderableTableBody,
    OrderableTableHeader,
    OrderableTableRow,
    useModalState,
} from '@proton/components/components';
import { useAddresses } from '@proton/components/hooks';
import { wait } from '@proton/shared/lib/helpers/promise';
import { IWasmApiWalletData } from '@proton/wallet';

import { EmailIntegrationModal } from './EmailIntegrationModal';

interface Props {
    wallet: IWasmApiWalletData;
    otherWallets: IWasmApiWalletData[];
}

export const AccountsOrderableList = ({ wallet, otherWallets }: Props) => {
    const accounts = wallet.WalletAccounts;
    const [tmpAccounts, setTmpAccounts] = useState<WasmApiWalletAccount[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string>();
    const selectedAccount = useMemo(
        () => accounts.find(({ ID }) => ID === selectedAccountId),
        [accounts, selectedAccountId]
    );

    const [addresses] = useAddresses();

    const filteredAddresses = useMemo(() => {
        const alreadyUsedAddresses = [wallet, ...otherWallets].flatMap(({ WalletAccounts }) =>
            WalletAccounts.flatMap(({ Addresses }) => Addresses.flatMap(({ ID }) => ID))
        );

        return addresses?.filter(({ ID }) => !alreadyUsedAddresses.includes(ID)) ?? [];
    }, [wallet, otherWallets, addresses]);

    const [emailIntegrationModal, setIsEmailIntegrationModalOpen, render] = useModalState();

    useEffect(() => {
        const cloned = [...(accounts ?? [])];

        // TODO: add Priority field on accounts
        // cloned.sort((a, b) => a.Priority - b.Wallet.Priority);
        return setTmpAccounts(cloned);
    }, [accounts]);

    if (!accounts) {
        return <CircleLoader />;
    }

    const getScrollContainer: ContainerGetter = () => document.querySelector('.main-area') as HTMLElement;

    const onSortEnd: SortEndHandler = async ({ oldIndex, newIndex }) => {
        try {
            const nextWallets: any[] = arrayMove(tmpAccounts, oldIndex, newIndex);

            setTmpAccounts(nextWallets);

            // todo: send this to server
            // const walletsToSave = nextWallets.map((wallet, index) => ({
            //     ...wallet,
            //     priority: index,
            // }));

            await wait(2000);
        } catch (e: any) {}
    };

    return (
        <>
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
                        <th scope="col">{c('Wallet Settings').t`Account label`}</th>
                        <th scope="col" className="w-custom" style={{ '--w-custom': '15em' }}>{c('Wallet Settings')
                            .t`Status`}</th>
                        <th scope="col">{c('Wallet Settings').t`Email integrations`}</th>
                        <th scope="col" className="w-custom" style={{ '--w-custom': '10em' }}>{c('Wallet Settings')
                            .t`Currency`}</th>
                        <th scope="col">{c('Wallet Settings').t`Action`}</th>
                    </tr>
                </OrderableTableHeader>
                <OrderableTableBody colSpan={0}>
                    {tmpAccounts.map((account, index) => (
                        <OrderableTableRow
                            index={index}
                            key={`wallet_${account.ID}`}
                            cells={[
                                <div key="name" className="text-ellipsis max-w-full" title={account.Label}>
                                    <Input readOnly value={account.Label}></Input>
                                </div>,

                                // TODO: add Priority field on accounts
                                <div>
                                    {index === 0 && (
                                        <Badge type="primary">{c('Wallet Settings').t`Default account`}</Badge>
                                    )}
                                </div>,
                                <Button
                                    shape="underline"
                                    color="weak"
                                    onClick={() => {
                                        setSelectedAccountId(account.ID);
                                        setIsEmailIntegrationModalOpen(true);
                                    }}
                                >
                                    {c('Wallet Settings').ngettext(
                                        msgid`${account.Addresses.length} address linked`,
                                        `${account.Addresses.length} addresses linked`,
                                        account.Addresses.length
                                    )}
                                </Button>,
                                // TODO: add Currency to wallet account?
                                <div>USD</div>,
                                <Button color="weak" size="small">
                                    {c('Action').t`Save`}
                                </Button>,
                            ]}
                        />
                    ))}
                </OrderableTableBody>
            </OrderableTable>

            {render && selectedAccount && (
                <EmailIntegrationModal
                    {...emailIntegrationModal}
                    addresses={filteredAddresses}
                    account={selectedAccount}
                />
            )}
        </>
    );
};
