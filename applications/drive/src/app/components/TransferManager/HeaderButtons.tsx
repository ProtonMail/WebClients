import { c } from 'ttag';
import { classnames } from '@proton/components';

import { Download, TransferType, Upload } from '@proton/shared/lib/interfaces/drive/transfer';
import useTransferControls from './useTransferControls';
import Buttons from './Buttons';
import {
    isTransferCanceled,
    isTransferDone,
    isTransferFailed,
    isTransferFinalizing,
    isTransferOngoing,
    isTransferPaused,
} from '../../utils/transfer';
import { TransferManagerButtonProps } from './interfaces';

type TransferManagerEntry = { transfer: Upload | Download; type: TransferType };

interface HeaderButtonProps {
    entries: TransferManagerEntry[];
    className: string;
}

const extractTransferFromEntry = ({ transfer }: TransferManagerEntry) => transfer;

const isInvalidForCancellation = (transfer: Upload | Download) =>
    isTransferCanceled(transfer) ||
    isTransferFailed(transfer) ||
    isTransferFinalizing(transfer) ||
    isTransferDone(transfer);

const HeaderButton = ({ entries, className }: HeaderButtonProps) => {
    const transferManagerControls = useTransferControls();

    const areAllActiveTransfersPaused = entries
        .map(extractTransferFromEntry)
        .filter(isTransferOngoing)
        .every(isTransferPaused);
    const hasOnlyInactiveTransfers = entries
        .map(extractTransferFromEntry)
        .every((transfer) => !isTransferOngoing(transfer));

    /*
     * Pause icon gets priority over resume icon. Here are the rules:
     *
     * - mixed transfer –> pause
     * - only in progress –> pause
     * - cancelled or failed -> pause (disabled)
     * – all *active* transfers are paused -> resume
     */
    const shouldDisplayResume = entries.length !== 0 && areAllActiveTransfersPaused && !hasOnlyInactiveTransfers;

    const testIdPrefix = 'drive-transfers-manager:header-controls-';

    const buttons: TransferManagerButtonProps[] = [
        {
            onClick: () => {
                const ongoingEntries = entries.filter(({ transfer }) => isTransferOngoing(transfer));
                if (shouldDisplayResume) {
                    return transferManagerControls.resumeTransfers(ongoingEntries);
                }

                return transferManagerControls.pauseTransfers(ongoingEntries);
            },
            disabled: hasOnlyInactiveTransfers,
            title: shouldDisplayResume ? c('Action').t`Resume all` : c('Action').t`Pause all`,
            iconName: shouldDisplayResume ? 'play' : 'pause',
            testId: testIdPrefix + (shouldDisplayResume ? 'play' : 'pause'),
        },
        {
            onClick: () => {
                transferManagerControls.cancelTransfers(
                    entries.filter((entry) => !isInvalidForCancellation(entry.transfer))
                );
            },
            // Only cancelled/failed/finalizing/done transfers -> cancel button disabled
            disabled: entries.map(extractTransferFromEntry).every(isInvalidForCancellation),
            title: c('Action').t`Cancel all`,
            iconName: 'xmark',
            testId: testIdPrefix + 'cancel',
        },
        {
            onClick: () => {
                return transferManagerControls.restartTransfers(
                    entries.filter(({ transfer }) => {
                        return isTransferFailed(transfer);
                    })
                );
            },
            /*
             * Restart enabled when there're failed transfers in the list. This also covers
             * the case when theres only transfers in progress
             */
            disabled: !entries.map(extractTransferFromEntry).some(isTransferFailed),
            title: c('Action').t`Restart all`,
            iconName: 'arrow-rotate-right',
            testId: testIdPrefix + 'restart',
        },
    ];

    return (
        <div
            className={classnames([
                'flex',
                'flex-nowrap',
                'flex-justify-end',
                'no-scroll',
                'flex-item-noshrink',
                className,
            ])}
        >
            <Buttons buttons={buttons} className="flex-item-noshrink" />
        </div>
    );
};

export default HeaderButton;
