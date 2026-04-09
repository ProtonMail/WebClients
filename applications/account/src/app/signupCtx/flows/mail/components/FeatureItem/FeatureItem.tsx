import type { ReactNode } from 'react';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import clsx from '@proton/utils/clsx';

interface Props {
    highlighted?: boolean;
    text: ReactNode;
    tooltip?: ReactNode;
    icon?: ReactNode;
    iconClassName?: string;
    textClassName?: string;
}

const FeatureItem = ({
    highlighted,
    text,
    tooltip,
    icon = <IcCheckmark size={6} />,
    iconClassName,
    textClassName,
}: Props) => {
    return (
        <li className="flex flex-nowrap gap-2 items-center">
            <span className={clsx('shrink-0', iconClassName, highlighted ? 'color-success' : 'color-weak')}>
                {icon}
            </span>
            <Tooltip title={tooltip} openDelay={200}>
                <span
                    className={clsx(
                        textClassName,
                        highlighted ? 'color-norm' : 'color-weak',
                        tooltip ? 'text-underline-dashed cursor-pointer' : null
                    )}
                    style={{
                        textDecorationColor: 'var(--text-weak)',
                        textUnderlineOffset: '0.35rem',
                        textDecorationThickness: '1px',
                    }}
                >
                    {text}
                </span>
            </Tooltip>
        </li>
    );
};

export default FeatureItem;
