import type { ReactNode, VFC } from 'react';

import { Icon, type IconName } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { FieldBox, type FieldBoxProps } from '../Layout/FieldBox';

import './ValueControl.scss';

type ContainerElement = 'div' | 'pre' | 'p' | 'ul';

export type ValueControlProps = Omit<FieldBoxProps, 'icon'> & {
    as?: ContainerElement;
    children: ReactNode;
    icon?: IconName;
    label: string;
    interactive?: boolean;
    invalid?: boolean;
    loading?: boolean;
    extra?: ReactNode;
    valueClassName?: string;
};

const getClassNameByElementType = (element: ContainerElement): string => {
    switch (element) {
        case 'pre':
            return 'text-break';
        default:
            return 'text-ellipsis';
    }
};

export const ValueControl: VFC<ValueControlProps> = ({
    actions,
    as = 'div',
    children,
    icon,
    label,
    interactive = false,
    invalid = false,
    loading = false,
    extra,
    valueClassName,
}) => {
    const ValueContainer = as;

    return (
        <div className={clsx(interactive && 'pass-value-control--interactive', !loading && invalid && 'border-danger')}>
            <FieldBox
                actions={actions}
                icon={icon && <Icon name={icon} size={20} style={{ color: 'var(--fieldset-cluster-icon-color)' }} />}
            >
                <div className="color-weak text-sm">{label}</div>
                <ValueContainer
                    className={clsx(
                        'pass-value-control--value m-0 p-0 user-select-none',
                        getClassNameByElementType(as),
                        valueClassName
                    )}
                >
                    {loading ? <div className="pass-skeleton pass-skeleton--value" /> : children}
                </ValueContainer>
                {extra}
            </FieldBox>
        </div>
    );
};
