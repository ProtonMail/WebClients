import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import {
    isTransferCanceled,
    isTransferDone,
    isTransferFailed,
    isTransferFinalizing,
    isTransferOngoing,
    isTransferPaused,
    isTransferSkipped,
} from '../../utils/transfer';
import Buttons from './Buttons';
import DownloadLogsButton from './DownloadLogsButton';
import type { TransferManagerButtonProps } from './interfaces';
import type { Download, TransferType, Upload } from './transfer';
import useTransferControls from './useTransferControls';

type TransferManagerEntry = { transfer: Upload | Download; type: TransferType };

interface HeaderButtonProps {
    entries: TransferManagerEntry[];
    className: string;
    showDownloadLog: boolean;
}

const extractTransferFromEntry = ({ transfer }: TransferManagerEntry) => transfer;

const isInvalidForCancellation = (transfer: Upload | Download) =>
    isTransferCanceled(transfer) ||
    isTransferSkipped(transfer) ||
    isTransferFailed(transfer) ||
    isTransferFinalizing(transfer) ||
    isTransferDone(transfer);

const HeaderButton = ({ entries, className, showDownloadLog = false }: HeaderButtonProps) => {
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
            iconName: 'cross',
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
        <div className={clsx(['flex', 'flex-nowrap', 'justify-end', 'overflow-hidden', 'shrink-0', className])}>
            <Buttons buttons={buttons} className="shrink-0">
                {showDownloadLog && <DownloadLogsButton onClick={transferManagerControls.downloadLogs} />}
            </Buttons>
        </div>
    );
};

export default HeaderButton;
