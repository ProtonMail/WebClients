import { MouseEvent } from 'react';
import { classnames } from '../../helpers';
import Tooltip from '../tooltip/Tooltip';
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
    maxNumber?: number;
    className?: string;
    showDropDown?: boolean;
}

const LabelStack = ({ labels, showDelete = false, isStacked = false, maxNumber, showDropDown, className }: Props) => {
    const labelsToShow = labels.slice(0, maxNumber);
    const labelsOverflow = labels.slice(maxNumber || labels.length);

    return (
        <ul
            className={classnames([
                'label-stack unstyled m0 inline-flex max-w100 flex-row flex-align-items-center stop-propagation',
                isStacked && 'is-stacked',
                className,
            ])}
        >
            {labelsToShow.map((label: LabelDescription) => (
                <LabelStackItem label={label} key={label.name} showDropdown={showDropDown} showDelete={showDelete} />
            ))}
            {labelsOverflow.length > 0 && (
                <li className="label-stack-overflow-count flex">
                    <Tooltip title={labelsOverflow.map((label) => label.name).join(', ')}>
                        <span>+{labelsOverflow.length}</span>
                    </Tooltip>
                </li>
            )}
        </ul>
    );
};

export default LabelStack;
