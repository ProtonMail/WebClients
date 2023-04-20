import type { ElementType, ReactElement, ReactNode, VFC } from 'react';

import { Icon, type IconName, InputFieldTwo } from '@proton/components';
import type { InputFieldProps } from '@proton/components/components/v2/field/InputField';
import type { ItemType, MaybeArray } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import { BaseInputGroup, Props as BaseInputGroupProps } from './InputGroup';

type Status = 'default' | 'error';
type StatusProps = { icon: { style: { color: string } }; input: { labelContainerClassName: string } };
type StatusPropsMap = { [K in Status]: StatusProps };
type BaseProps = {
    status?: Status;
    actions?: MaybeArray<ReactElement>;
    itemType?: ItemType;
    icon?: IconName;
    customInputGroupProps?: Partial<BaseInputGroupProps>;
    className?: string;
};
type CustomInputControlProps = BaseProps & { children: (renderProps: StatusProps['input']) => ReactNode };
export type InputControlProps<T extends ElementType = ElementType> = InputFieldProps<T> & BaseProps;

const STATUS_PROPS_MAP: StatusPropsMap = {
    default: {
        icon: { style: { color: 'var(--fieldset-cluster-icon-color)' } },
        input: {
            labelContainerClassName: 'color-weak text-normal text-sm',
        },
    },
    error: {
        icon: { style: { color: 'var(--signal-danger)' } },
        input: { labelContainerClassName: 'color-danger text-normal text-sm' },
    },
};

export const CustomInputControl: VFC<CustomInputControlProps> = ({
    icon,
    status = 'default',
    actions,
    customInputGroupProps,
    children,
    className,
}) => (
    <BaseInputGroup
        icon={icon && <Icon name={icon} size={20} {...STATUS_PROPS_MAP[status].icon} />}
        actions={actions}
        {...customInputGroupProps}
        className={clsx([customInputGroupProps?.className, className])}
    >
        {children(STATUS_PROPS_MAP[status].input)}
    </BaseInputGroup>
);

export const InputControl = <T extends ElementType>({
    icon,
    status,
    actions,
    itemType,
    ...rest
}: InputControlProps<T>) => {
    const fieldProps = rest as InputFieldProps<T>;

    return (
        <CustomInputControl
            icon={icon}
            status={status}
            actions={actions}
            itemType={itemType}
            customInputGroupProps={{ className: 'px-4 py-3' }}
        >
            {(inputProps) => (
                <InputFieldTwo<T> assistContainerClassName="hidden-empty" unstyled {...inputProps} {...fieldProps} />
            )}
        </CustomInputControl>
    );
};
