import type { ReactNode } from 'react';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import type { IconName } from '@proton/components';
import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

import type { SecurityCheckupCardInnerProps } from './SecurityCheckupCardInner';
import SecurityCheckupCardInner from './SecurityCheckupCardInner';

interface SecurityCheckupCardButtonInnerProps extends Omit<SecurityCheckupCardInnerProps, 'suffix'> {
    loading?: boolean;
    icon?: IconName;
}

export const SecurityCheckupCardButtonInner = ({
    loading,
    icon = 'chevron-right',
    ...rest
}: SecurityCheckupCardButtonInnerProps) => {
    return (
        <SecurityCheckupCardInner
            suffix={<div className="p-2">{loading ? <CircleLoader /> : <Icon name={icon} size={5} />}</div>}
            {...rest}
        />
    );
};

interface Props {
    onClick?: () => void;
    className?: string;
    children?: ReactNode;
}

const SecurityCheckupCardButton = ({ onClick, className, children }: Props) => {
    return (
        <button className={clsx('security-checkup-card', 'relative interactive-pseudo', className)} onClick={onClick}>
            {children}
        </button>
    );
};

export default SecurityCheckupCardButton;
