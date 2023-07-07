import { type ReactNode, type VFC, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, type IconName } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { FieldBox, type FieldBoxProps } from '../Layout/FieldBox';
import { ClickToCopy } from './ClickToCopy';

import './ValueControl.scss';

type ContainerElement = 'div' | 'pre' | 'p' | 'ul';

export type ValueControlProps = Omit<FieldBoxProps, 'icon'> & {
    as?: ContainerElement;
    children?: ReactNode;
    clickToCopy?: boolean;
    error?: boolean;
    extra?: ReactNode;
    hidden?: boolean;
    hiddenValue?: string;
    icon?: IconName;
    label: string;
    loading?: boolean;
    value?: string;
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

const HideButton = ({ hidden, onClick }: { hidden: boolean; onClick: () => void }) => (
    <Button
        icon
        pill
        color="weak"
        onClick={onClick}
        size="medium"
        shape="solid"
        title={hidden ? c('Action').t`Show` : c('Action').t`Hide`}
    >
        <Icon size={20} name={hidden ? 'eye' : 'eye-slash'} />
    </Button>
);

/* When passed both children and a value prop:
 * children will be rendered, value will be passed
 * to ClickToCopy */
export const ValueControl: VFC<ValueControlProps> = ({
    actions,
    actionsContainerClassName,
    as = 'div',
    children,
    clickToCopy = false,
    error = false,
    extra,
    hidden = false,
    hiddenValue,
    icon,
    label,
    loading = false,
    value,
    valueClassName,
}) => {
    const [hide, setHide] = useState(hidden);
    const ValueContainer = as;
    const defaultHiddenValue = '••••••••••••';

    const displayValue = useMemo(() => {
        if (!value && !children) return <div className="color-weak">{c('Info').t`None`}</div>;
        if (hidden && hide) return hiddenValue ?? defaultHiddenValue;
        if (children) return children;
        return value;
    }, [children, hidden, hide, value]);

    return (
        <ClickToCopy
            className={clsx(
                clickToCopy && value && 'pass-value-control--interactive',
                !loading && error && 'border-danger'
            )}
            enabled={clickToCopy}
            value={value}
        >
            <FieldBox
                actions={
                    hidden && value
                        ? [<HideButton hidden={hide} onClick={() => setHide((prev) => !prev)} />, actions ?? []].flat()
                        : actions
                }
                actionsContainerClassName={actionsContainerClassName}
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
                    {loading ? <div className="pass-skeleton pass-skeleton--value" /> : displayValue}
                </ValueContainer>
                {extra}
            </FieldBox>
        </ClickToCopy>
    );
};
