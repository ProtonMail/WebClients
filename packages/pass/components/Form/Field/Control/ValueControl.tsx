import type { ComponentType, ElementType, ReactElement } from 'react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, type IconName } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { FieldBox, type FieldBoxProps } from '../Layout/FieldBox';
import type { ClickToCopyProps } from './ClickToCopy';
import { ClickToCopy } from './ClickToCopy';

import './ValueControl.scss';

const isIntrinsicElement = <E extends ElementType>(c: E) => typeof c === 'string' || typeof c === 'symbol';

export type ValueControlProps<E extends ElementType> = Omit<FieldBoxProps, 'icon'> & {
    as?: E;
    children?: E extends ComponentType<infer U> ? (U extends { children?: infer C } ? C : never) : ReactNode;
    className?: string;
    clickToCopy?: boolean;
    clipboardValue?: string | (() => string);
    disabled?: boolean;
    ellipsis?: boolean;
    error?: boolean;
    extra?: ReactNode;
    hidden?: boolean;
    hiddenValue?: string;
    icon?: IconName | ReactElement;
    label: ReactNode;
    loading?: boolean;
    value?: string;
    valueClassName?: string;
    onCopy?: () => void;
    onHide?: (hide: boolean) => void;
};

const HideButton = ({ hidden, onClick }: { hidden: boolean; onClick: () => void }) => (
    <Button
        icon
        pill
        color="norm"
        onClick={onClick}
        size="medium"
        shape="ghost"
        title={hidden ? c('Action').t`Show` : c('Action').t`Hide`}
    >
        <Icon size={5} name={hidden ? 'eye' : 'eye-slash'} />
    </Button>
);

const DEFAULT_HIDDEN_VALUE = '••••••••••••';

/* When passed both children and a value prop:
 * children will be rendered, value will be passed
 * to ClickToCopy */
export const ValueControl = <E extends ElementType = 'div'>({
    actions,
    actionsContainerClassName,
    as,
    children,
    className,
    clickToCopy = false,
    clipboardValue,
    disabled = false,
    ellipsis = true,
    error = false,
    extra,
    hidden = false,
    hiddenValue,
    icon,
    label,
    loading = false,
    value,
    valueClassName,
    onClick,
    onCopy,
    onHide,
}: ValueControlProps<E>) => {
    /* we're leveraging type-safety at the consumer level - we're recasting
     * the `as` prop as a generic `ElementType` to avoid switching over all
     * possible sub-types. Trade-off is being extra careful with the children
     * the `ValueContainer` can accept */
    const ValueContainer = (as ?? 'div') as ElementType;
    const intrinsicEl = isIntrinsicElement(ValueContainer);

    const [hide, setHide] = useState(hidden);
    useEffect(() => onHide?.(hide), [onHide, hide]);

    const displayValue = useMemo(() => {
        /* intrinsinc elements support nesting custom DOM structure */
        if (intrinsicEl && loading) return <div className="pass-skeleton pass-skeleton--value" />;
        if (intrinsicEl && !value && !children) return <div className="color-weak">{c('Info').t`None`}</div>;

        if (hide) return hiddenValue ?? DEFAULT_HIDDEN_VALUE;

        /* if children are passed: display them - when working with
         * a `ValueContainer` component, we leverage the inherited prop
         * type-safety */
        if (children) return children;

        /* if no children provided: fallback to value which is always
         * a valid "string" ReactNode */
        return value ?? '';
    }, [value, children, loading, hide, intrinsicEl]);

    const canCopy = clickToCopy && value;
    const interactive = (canCopy || onClick) && !disabled;

    const MaybeClickToCopy: ElementType<ClickToCopyProps> = canCopy ? ClickToCopy : 'div';

    return (
        <MaybeClickToCopy
            className={clsx(
                'pass-value-control',
                interactive && 'pass-value-control--interactive cursor-pointer',
                !loading && error && 'border-danger',
                disabled && 'opacity-50',
                className
            )}
            {...(canCopy ? { value: clipboardValue ?? value, onCopy } : { onClick: disabled ? undefined : onClick })}
        >
            <FieldBox
                actions={
                    hidden && value
                        ? [<HideButton hidden={hide} onClick={() => setHide((prev) => !prev)} />, actions ?? []].flat()
                        : actions
                }
                actionsContainerClassName={actionsContainerClassName}
                icon={icon}
            >
                <div className="color-weak text-sm text-ellipsis">{label}</div>

                <ValueContainer
                    key={`${hide ? 'hidden' : 'visible'}-container`}
                    className={clsx(
                        'pass-value-control--value m-0 p-0',
                        !disabled && 'cursor-pointer',
                        ellipsis ? 'text-ellipsis' : 'text-break text-pre-wrap',
                        hide && 'text-nowrap overflow-hidden',
                        valueClassName
                    )}
                    children={displayValue}
                />

                {extra}
            </FieldBox>
        </MaybeClickToCopy>
    );
};
