import type { ReactNode, VFC } from 'react';

import { Icon, type IconName } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { InputGroup, Props as InputGroupProps } from './InputGroup';

import './ValueControl.scss';

type ContainerElement = 'div' | 'pre' | 'p' | 'ul';

type Props = Omit<InputGroupProps, 'icon'> & {
    as?: ContainerElement;
    children: ReactNode;
    icon?: IconName;
    label: string;
    interactive?: boolean;
    invalid?: boolean;
    loading?: boolean;
};

export const ValueControl: VFC<Props> = ({
    actions,
    as = 'div',
    children,
    icon,
    label,
    interactive = false,
    invalid = false,
    loading = false,
}) => {
    const ValueContainer = as;

    return (
        <div className={clsx(interactive && 'pass-value-control--interactive', !loading && invalid && 'border-danger')}>
            <InputGroup
                icon={icon && <Icon name={icon} size={20} style={{ color: 'var(--fieldset-cluster-icon-color)' }} />}
                actions={actions}
            >
                <div className="color-weak text-sm">{label}</div>
                <ValueContainer className="pass-value-control--value m-0 p-0 text-ellipsis">
                    {loading ? <div className="pass-skeleton pass-skeleton--value" /> : children}
                </ValueContainer>
            </InputGroup>
        </div>
    );
};
