import { c } from 'ttag';

import { classnames, Details, Radio, Summary } from '@proton/components';

import { Download, TransferGroup, TransferType, Upload } from '@proton/shared/lib/interfaces/drive/transfer';
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

const TRANSFER_GROUPS = [
    {
        value: undefined,
        // translator: the label is for a button resetting current filter and displaying all the transfers."
        label: c('Label').t`All`,
    },
    {
        value: TransferGroup.ACTIVE,
        // translator: the label is for a button showing only active transfers"
        label: c('Label').t`Active`,
    },
    {
        value: TransferGroup.DONE,
        // translator: the label is for a button showing only completed transfers"
        label: c('Label').t`Completed`,
    },
    {
        value: TransferGroup.FAILURE,
        // translator: the label is for a button showing only failed transfers"
        label: c('Label').t`Failed`,
    },
];

type TransferManagerEntry = { transfer: Upload | Download; type: TransferType };

interface ToolbarProps {
    currentTransferGroup?: TransferGroup;
    onTransferGroupFilterChange: (transferGroup: TransferGroup | undefined) => void;
    entries: TransferManagerEntry[];
    isExpanded: boolean;
    onExpand: (isExpanded: boolean) => void;
}

const extractTransferFromEntry = ({ transfer }: TransferManagerEntry) => transfer;

const isInvalidForCancellation = (transfer: Upload | Download) =>
    isTransferCanceled(transfer) ||
    isTransferFailed(transfer) ||
    isTransferFinalizing(transfer) ||
    isTransferDone(transfer);

const Toolbar = ({
    onTransferGroupFilterChange,
    currentTransferGroup,
    entries,
    isExpanded,
    onExpand,
}: ToolbarProps) => {
    const transferManagerControls = useTransferControls();

    const areAllActiveTransfersPaused = entries
        .map(extractTransferFromEntry)
        .filter(isTransferOngoing)
        .every(isTransferPaused);
    const hasOnlyInactiveTransfers = entries
        .map(extractTransferFromEntry)
        .every((transfer) => !isTransferOngoing(transfer));

    /*
     * Pause icon get priority over resume. Here are the rules:
     *
     * - mixed transfer –> pause
     * - only in progress –> pause
     * - cancelled or failed -> pause (disabled)
     * – all *active* transfers are paused -> resume
     */
    const shouldDisplayResume = entries.length !== 0 && areAllActiveTransfersPaused && !hasOnlyInactiveTransfers;

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
            title: shouldDisplayResume ? c('Action').t`Resume transfers` : c('Action').t`Pause transfers`,
            iconName: shouldDisplayResume ? 'play' : 'pause',
            actionType: shouldDisplayResume ? 'play' : 'pause',
        },
        {
            onClick: () => {
                transferManagerControls.cancelTransfers(
                    entries.filter((entry) => !isInvalidForCancellation(entry.transfer))
                );
            },
            // Only cancelled/failed/finalizing/done transfers -> cancel button disabled
            disabled: entries.map(extractTransferFromEntry).every(isInvalidForCancellation),
            title: c('Action').t`Cancel transfers`,
            iconName: 'xmark',
            actionType: 'cancel',
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
            title: c('Action').t`Restart transfers`,
            iconName: 'arrow-rotate-right',
            actionType: 'restart',
        },
    ];

    return (
        <div className="transfers-manager-toolbar" data-testid="drive-transfers-manager:toolbar-details">
            <Details
                open={isExpanded}
                onToggle={() => {
                    onExpand(!isExpanded);
                }}
                className="border-none"
            >
                <Summary tabIndex={0} className="pl1 pr1">
                    <span>{c('Title').t`Additional settings`}</span>
                </Summary>
                <div className={classnames(['transfers-manager-controls pb1 pt0-5 pl1 pr1'])}>
                    <div className="transfers-manager-status-filter flex flex-nowrap flex-align-items-center text-ellipsis">
                        {TRANSFER_GROUPS.map((group) => (
                            <Radio
                                name="transfers-manager-controls-radio"
                                className="mr1"
                                value={group.value}
                                key={group.label}
                                id={`transfer-filter-${group.value}`}
                                checked={group.value === currentTransferGroup}
                                onChange={() => onTransferGroupFilterChange(group.value)}
                            >
                                {group.label}
                            </Radio>
                        ))}
                    </div>
                    <div className="flex flex-nowrap flex-justify-end no-scroll flex-item-noshrink">
                        <span className="mr1 text-ellipsis">{c('Label').t`Apply to selection`}</span>
                        <Buttons buttons={buttons} className="flex-item-noshrink" />
                    </div>
                </div>
            </Details>
        </div>
    );
};

export default Toolbar;
