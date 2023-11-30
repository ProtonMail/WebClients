import { useCallback, useState } from 'react';

import { SelectChangeEvent } from '@proton/components/components/selectTwo/select';

import { Account, BitcoinUnit, Recipient, Wallet } from '../../types';

export type TempRecipient = Recipient & { uuid: number; unit: BitcoinUnit };

const EMPTY_RECIPIENT = { address: '', amount: 0, unit: BitcoinUnit.SATS };
let uuid = 0;

type ReallocateNewBalanceAcc = { remainingAmount: number; recipients: TempRecipient[] };

/**
 * This functions allocates a given balance accross the provided recipients.
 * If recipients total amount is greater than provided balance, the last recipients will be allocated less than initially.
 * "First come, first served"
 */
const allocateNewBalance = (recipients: TempRecipient[], balance: number) => {
    const { recipients: updatedRecipients } = recipients.reduce(
        (acc: ReallocateNewBalanceAcc, current) => {
            // If remainingAmount = 123 and recipient's amount is 100, we'll allocate 100
            // If remainingAmount = 73 and recipient's amount is 100, we'll allocate only 73
            const amountToAllocate = Math.min(acc.remainingAmount, current.amount);
            const nextRemainingBalance = acc.remainingAmount - amountToAllocate;

            return {
                remainingAmount: nextRemainingBalance,
                recipients: [...acc.recipients, { ...current, amount: amountToAllocate }],
            };
        },
        { remainingAmount: balance, recipients: [] }
    );

    return updatedRecipients;
};

export const useOnchainTransactionBuilder = (wallets: Wallet[], accounts: Account[], defaultWalletId?: string) => {
    const defaultWallet = wallets.find(({ id }) => defaultWalletId === id) ?? wallets[0];

    const [selectedWallet, setSelectedWallet] = useState(defaultWallet);
    const [selectedAccount, setSelectedAccount] = useState(accounts[0]);

    const [recipients, setRecipients] = useState<TempRecipient[]>([{ ...EMPTY_RECIPIENT, uuid: uuid++ }]);

    const handleSelectWallet = ({ value }: SelectChangeEvent<string>) => {
        const wallet = wallets.find(({ id }) => id === value);

        if (!wallet) {
            return;
        }

        setSelectedWallet(wallet);

        // Reallocate balance to avoid over balanced transactions that would fail
        const updatedRecipients = allocateNewBalance(recipients, wallet.balance);
        setRecipients(updatedRecipients);
    };

    const handleSelectAccount = ({ value }: SelectChangeEvent<string>) => {
        const account = accounts.find(({ id }) => id === value);
        if (account) {
            setSelectedAccount(account);
        }

        // TODO: reallocate amount for account balance when connected to account API
    };

    const addRecipient = useCallback(() => {
        setRecipients((prev) => [...prev, { ...EMPTY_RECIPIENT, uuid: uuid++ }]);
    }, []);

    const removeRecipient = useCallback((index) => {
        setRecipients((prev) => [...prev.slice(0, index), ...prev.slice(index + 1)]);
    }, []);

    const updateRecipient = useCallback(
        (index, update: Partial<Omit<TempRecipient, 'amount'>>) => {
            if (!recipients[index]) {
                return;
            }

            setRecipients([
                ...recipients.slice(0, index),
                { ...recipients[index], ...update },
                ...recipients.slice(index + 1),
            ]);
        },
        [recipients]
    );

    const updateRecipientAmount = (index: number, amount: number) => {
        if (!recipients[index]) {
            return;
        }

        const before = recipients.slice(0, index);
        const after = recipients.slice(index + 1);

        const recipient = recipients[index];

        const otherRecipients = [...before, ...after];
        const totalAllocated = otherRecipients.reduce((acc, recipient) => acc + recipient.amount, 0);
        const remainingAmount = selectedWallet.balance - totalAllocated;

        // If remainingAmount = 123 and update's amount is 100, we'll allocate 100
        // If remainingAmount = 73 and update's amount is 100, we'll allocate only 73
        amount = Math.min(remainingAmount, amount);
        setRecipients([...before, { ...recipient, amount }, ...after]);
    };

    return {
        selectedWallet,
        selectedAccount,
        recipients,
        handleSelectWallet,
        handleSelectAccount,
        addRecipient,
        updateRecipient,
        updateRecipientAmount,
        removeRecipient,
    };
};
