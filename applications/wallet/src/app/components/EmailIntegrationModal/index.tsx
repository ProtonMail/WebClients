import { useState } from 'react';

import { c } from 'ttag';

import { WasmApiWalletAccount } from '@proton/andromeda';
import { Button } from '@proton/atoms/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import {
    Autocomplete,
    ModalOwnProps,
    ModalTwoFooter,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from '@proton/components/components';
import { useNotifications } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store';
import { Address } from '@proton/shared/lib/interfaces';
import { useWalletApiClients, walletAccountUpdate } from '@proton/wallet';

import { Modal } from '../../atoms';

interface Props extends ModalOwnProps {
    addresses: Address[];
    account: WasmApiWalletAccount;
}

export const EmailIntegrationModal = ({ addresses, account, ...modalProps }: Props) => {
    const [value, setValue] = useState('');
    const [isLoading, withLoading] = useLoading();
    const { createNotification } = useNotifications();

    const options = addresses.map((addr) => ({ label: addr.Email, value: addr.ID }));
    const api = useWalletApiClients();
    const dispatch = useDispatch();

    const onAdd = async (emailAddressId: string) => {
        try {
            const { Data: updatedAccount } = await api.wallet.addEmailAddress(
                account.WalletID,
                account.ID,
                emailAddressId
            );

            createNotification({ text: c('Wallet Settings').t`Email address has been added` });
            dispatch(walletAccountUpdate(updatedAccount));
        } catch (e) {
            createNotification({ type: 'error', text: c('Wallet Settings').t`Could not add email address` });
        }
    };

    const onRemove = async (emailAddressId: string) => {
        try {
            const { Data: updatedAccount } = await api.wallet.removeEmailAddress(
                account.WalletID,
                account.ID,
                emailAddressId
            );

            createNotification({ text: c('Wallet Settings').t`Email address has been removed` });
            dispatch(walletAccountUpdate(updatedAccount));
        } catch (e) {
            createNotification({ type: 'error', text: c('Wallet Settings').t`Could not remove email address` });
        }
    };

    return (
        <Modal title={c('Wallet Settings').t`Email integration management`} {...modalProps} enableCloseWhenClickOutside>
            <Autocomplete
                id="email-autocomplete"
                value={value}
                onChange={setValue}
                onSelect={({ value }) => {
                    void withLoading(onAdd(value));
                }}
                placeholder="Email address"
                options={options}
                getData={({ label }) => label}
                disabled={isLoading}
            />

            <Table responsive="cards" hasActions className="mt-6">
                <TableHeader cells={[c('Wallet Setting').t`Email`, c('Wallet Setting').t`Action`]} />
                <TableBody>
                    {account.Addresses.map(({ ID, Email }) => (
                        <TableRow key={ID}>
                            <TableCell label="Name">{Email}</TableCell>
                            <TableCell>
                                <Button
                                    disabled={isLoading}
                                    size="small"
                                    onClick={() => {
                                        void withLoading(onRemove(ID));
                                    }}
                                >{c('Wallet Settings').t`Remove`}</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <ModalTwoFooter className="items-center">
                {isLoading && <CircleLoader size="small" className="mr-2 color-primary" />}
                <Button className="ml-auto">{c('Wallet Settings').t`Close`}</Button>
            </ModalTwoFooter>
        </Modal>
    );
};
