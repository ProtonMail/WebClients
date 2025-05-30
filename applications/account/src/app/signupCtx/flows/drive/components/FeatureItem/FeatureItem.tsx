import type { ReactNode } from 'react';

import { Tooltip } from '@proton/atoms';
import { SkeletonLoader } from '@proton/components';
import { IcCheckmark } from '@proton/icons';
import clsx from '@proton/utils/clsx';

interface Props {
    loading?: boolean;
    highlighted?: boolean;
    text: ReactNode;
    tooltip?: ReactNode;
    icon?: ReactNode;
    iconClassName?: string;
    textClassName?: string;
}

const FeatureItem = ({
    loading,
    highlighted,
    text,
    tooltip,
    icon = <IcCheckmark size={6} />,
    iconClassName,
    textClassName,
}: Props) => {
    if (loading) {
        return <SkeletonLoader width={'55%'} height={'1.5rem'} />;
    }
    return (
        <li className="flex flex-nowrap gap-2 items-center">
            <span className={clsx('shrink-0', iconClassName, highlighted ? 'color-success' : 'color-weak')}>
                {icon}
            </span>
            <Tooltip title={tooltip}>
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
