import { useState } from 'react';
import { c } from 'ttag';

import { classnames, Details, Radio, Summary } from '@proton/components';

import { TransferGroup } from '../../interfaces/transfer';

const TRANSFER_FILTER = [
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

interface ToolbarProps {
    currentTransferGroup?: TransferGroup;
    onTransferGroupFilterChange: (transferGroup: TransferGroup | undefined) => void;
}
const Toolbar = ({ onTransferGroupFilterChange, currentTransferGroup }: ToolbarProps) => {
    const [isExpanded, setIsExpanded] = useState(true);

    // const buttons: TransferControlsButtonProps[] = [
    //     {
    //         onClick: () => {},
    //         disabled: false,
    //         title: hasPausedTransfers ? c('Action').t`Pause transfers` : c('Action').t`Resume transfers`,
    //         iconName: hasPausedTransfers ? 'resume' : 'pause',
    //     },
    // ];

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
                        {TRANSFER_FILTER.map((filter) => (
                            <Radio
                                name="transfers-manager-controls-radio"
                                className="mr1"
                                value={filter.value}
                                key={filter.value}
                                id={`transfer-filter-${filter.value}`}
                                checked={filter.value === currentTransferGroup}
                                onChange={() => onTransferGroupFilterChange(filter.value)}
                            >
                                {filter.label}
                            </Radio>
                        ))}
                    </div>
                    {/* <TransferManagerControls buttons={buttons}/> */}
                </div>
            </Details>
        </div>
    );
};

export default Toolbar;
