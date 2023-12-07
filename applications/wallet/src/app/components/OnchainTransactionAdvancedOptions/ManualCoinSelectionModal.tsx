import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import {
    ModalTwo,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHeaderCell,
    TableRow,
} from '@proton/components/components';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import clsx from '@proton/utils/clsx';

import { WasmOutPoint } from '../../../pkg';
import { BitcoinAmount } from '../../atoms';
import { AccountWithBlockchainData } from '../../types';
import { confirmationTimeToHumanReadable } from '../../utils';
import { useManualCoinSelectionModal } from './useManualCoinSelectionModal';

interface Props {
    isOpen: boolean;
    account?: AccountWithBlockchainData;
    selectedUtxos: WasmOutPoint[];
    onClose: () => void;
    onCoinSelected: (coins: WasmOutPoint[]) => void;
}

export const ManualCoinSelectionModal = ({ isOpen, onClose, account, selectedUtxos, onCoinSelected }: Props) => {
    const {
        utxos,
        activeUtxo,
        setActiveUtxo,
        tmpSelectedUtxos,
        handleToggleUtxoSelection,
        handleConfirmCoinSelection,
    } = useManualCoinSelectionModal(isOpen, selectedUtxos, onCoinSelected, account);

    return (
        <ModalTwo
            title={c('Wallet Send').t`Select coins`}
            size="large"
            open={isOpen}
            onClose={onClose}
            enableCloseWhenClickOutside
        >
            <ModalContent className="pt-2">
                <span className="block h4 my-4 text-semibold">{c('Wallet Send').t`Select coins`}</span>

                <div className="max-h-custom overflow-y-auto flex" style={{ '--max-h-custom': '20rem' }}>
                    {utxos.length ? (
                        <Table className="text-sm">
                            <TableHeader>
                                <TableRow>
                                    <TableHeaderCell className="w-3/10">{c('Wallet Send').t`Date`}</TableHeaderCell>
                                    <TableHeaderCell className="w-4/10">{c('Wallet Send')
                                        .t`Script public key`}</TableHeaderCell>
                                    <TableHeaderCell className="w-3/10">{c('Wallet Send').t`Value`}</TableHeaderCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {utxos.map((utxo) => {
                                    const outpoint = utxo.outpoint[0];
                                    const isSelected = tmpSelectedUtxos.includes(outpoint);
                                    const isActive = activeUtxo === outpoint;

                                    const background = (() => {
                                        if (isSelected) {
                                            return isActive
                                                ? 'var(--interaction-norm-major-1)'
                                                : 'var(--interaction-norm)';
                                        }

                                        return isActive
                                            ? 'var(--interaction-weak-minor-2)'
                                            : 'var(--interaction-default)';
                                    })();

                                    return (
                                        <TableRow
                                            onMouseEnter={() => setActiveUtxo(outpoint)}
                                            onMouseLeave={() => setActiveUtxo(undefined)}
                                            key={outpoint}
                                            onClick={() => handleToggleUtxoSelection(outpoint)}
                                            className={clsx(
                                                'cursor-pointer',
                                                isSelected ? 'color-invert' : 'color-norm'
                                            )}
                                            style={{ background }}
                                        >
                                            <TableCell>
                                                {confirmationTimeToHumanReadable(utxo.confirmation_time)}
                                            </TableCell>
                                            <TableCell>
                                                {outpoint.slice(0, 10)}...
                                                {outpoint.slice(-10)}
                                            </TableCell>
                                            <TableCell>
                                                <BitcoinAmount>{Number(utxo.value)}</BitcoinAmount>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="m-auto text-semibold">{c('Wallet Send').t`No coin available`}</div>
                    )}
                </div>

                <div className="my-3 flex w-full items-end">
                    <Button className="ml-auto" onClick={onClose}>{c('Wallet Send').t`Cancel`}</Button>
                    <Button color="norm" className="ml-3" onClick={() => handleConfirmCoinSelection()}>{c('Wallet Send')
                        .t`Done`}</Button>
                </div>
            </ModalContent>
        </ModalTwo>
    );
};
