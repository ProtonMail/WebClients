import { useState } from 'react';
import { c } from 'ttag';

import { classnames, Details, Radio, Summary } from '@proton/components';

import { Download, TransferGroup, TransferType, Upload } from '../../interfaces/transfer';
import useTransferControls from './useTransferControls';
import Buttons from './Buttons';
import { isTransferActive, isTransferOngoing, isTransferPaused, isTransferProgress } from '../../utils/transfer';
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
}

const extractTransferFromEntry = ({ transfer }: TransferManagerEntry) => transfer;

const Toolbar = ({ onTransferGroupFilterChange, currentTransferGroup, entries }: ToolbarProps) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const transferManagerControls = useTransferControls();

    const hasPausedTransfers = entries.map(extractTransferFromEntry).some(isTransferPaused);
    const hasTransfersInProgress = entries.map(extractTransferFromEntry).some(isTransferProgress);
    const areAllActiveTransfersPaused = entries
        .map(extractTransferFromEntry)
        .filter(isTransferActive)
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
                if (hasTransfersInProgress) {
                    return transferManagerControls.pauseTransfers(entries);
                }

                if (hasPausedTransfers) {
                    return transferManagerControls.resumeTransfers(entries);
                }
            },
            disabled: hasOnlyInactiveTransfers,
            title: shouldDisplayResume ? c('Action').t`Resume transfers` : c('Action').t`Pause transfers`,
            iconName: shouldDisplayResume ? 'play' : 'pause',
        },
    ];

    const buttonLabel = c('Label').t`Apply to selected transfers`;
    return (
        <div className="transfers-manager-toolbar">
            <Details
                open={isExpanded}
                onToggle={() => {
                    setIsExpanded(!isExpanded);
                }}
                className="no-border"
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
                    <div className="flex flex-nowrap flex-justify-end">
                        <span className="mr1">{buttonLabel}</span>
                        <Buttons buttons={buttons} />
                    </div>
                </div>
            </Details>
        </div>
    );
};

export default Toolbar;
