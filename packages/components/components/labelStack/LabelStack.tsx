import type { MouseEvent } from 'react';

import { c } from 'ttag';

import Tooltip from '@proton/components/components/tooltip/Tooltip';
import clsx from '@proton/utils/clsx';

import LabelStackItem from './LabelStackItem';

export interface LabelDescription {
    name: string;
    color?: string;
    title?: string;
    onClick?: (event: MouseEvent) => void;
    onDelete?: (event: MouseEvent) => void;
}

interface Props {
    labels: LabelDescription[];
    showDelete?: boolean;
    isStacked?: boolean;
    /**
     * Reverses stacking order when isStacked is true.
     * Has no effect when isStacked is false.
     */
    leftToRight?: boolean;
    maxNumber?: number;
    className?: string;
    showDropDown?: boolean;
}

const LabelStack = ({
    labels,
    showDelete = false,
    isStacked = false,
    leftToRight = false,
    maxNumber,
    showDropDown,
    className,
}: Props) => {
    const labelsToShow = maxNumber ? labels.slice(0, maxNumber) : labels;
    const labelsOverflow = maxNumber ? labels.slice(maxNumber) : [];

    // translator: this text is not visible in the interface, it will be vocalized for blind people, to give them context of label buttons, like "Labels: <vocalisation of labels buttons>"
    const labelsContext = c('Info').t`Labels:`;

    return (
        <ul
            className={clsx([
                'label-stack unstyled m-0 inline-flex items-center stop-propagation rounded-sm',
                isStacked ? `is-stacked ${leftToRight ? 'flex-row-reverse' : 'flex-row'}` : 'flex-row',
                className,
            ])}
            aria-label={labelsContext}
        >
            {labelsToShow.map((label: LabelDescription) => (
                <LabelStackItem label={label} key={label.name} showDropdown={showDropDown} showDelete={showDelete} />
            ))}
            {labelsOverflow.length > 0 && (
                <li className="label-stack-overflow-count flex">
                    <Tooltip title={labelsOverflow.map((label) => label.name).join(', ')}>
                        <span data-testid="label-stack:labels-overflow">+{labelsOverflow.length}</span>
                    </Tooltip>
                </li>
            )}
        </ul>
    );
};

export default LabelStack;
