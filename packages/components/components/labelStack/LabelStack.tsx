import { MouseEvent } from 'react';
import { c } from 'ttag';
import { COLORS } from '@proton/shared/lib/calendar/constants';
import { classnames } from '../../helpers';
import Tooltip from '../tooltip/Tooltip';
import Icon from '../icon/Icon';

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
}

const LabelStack = ({ labels, showDelete = false, isStacked = false, maxNumber, className }: Props) => {
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
                <li
                    className="label-stack-item flex flex-row flex-align-items-center flex-justify-start flex-nowrap"
                    style={
                        label.color
                            ? {
                                  '--background': label.color,
                                  // TODO: Use white for now, re-introduce the readability calculation as soon as possible
                                  '--foreground': COLORS.WHITE,
                              }
                            : undefined
                    }
                    key={label.name}
                >
                    {label.onClick ? (
                        <button
                            type="button"
                            className="label-stack-item-button text-ellipsis"
                            onClick={label.onClick}
                            title={label.title}
                        >
                            <span className="label-stack-item-button-text">{label.name}</span>
                        </button>
                    ) : (
                        <span className="label-stack-item-button text-ellipsis" title={label.title}>
                            <span className="label-stack-item-button-text">{label.name}</span>
                        </span>
                    )}

                    {showDelete && (
                        <button
                            type="button"
                            className="label-stack-item-delete flex-item-noshrink"
                            onClick={label.onDelete}
                            title={`${c('Action').t`Remove`} ${label.title}`}
                        >
                            <Icon
                                name="xmark"
                                size={12}
                                className="label-stack-item-delete-icon"
                                alt={c('Action').t`Remove`}
                            />
                        </button>
                    )}
                </li>
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
