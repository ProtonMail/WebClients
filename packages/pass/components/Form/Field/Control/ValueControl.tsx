import type { ComponentType, ElementType } from 'react';
import { type ReactNode, useMemo, useState } from 'react';

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
    clickToCopy?: boolean;
    clipboardValue?: string;
    error?: boolean;
    ellipsis?: boolean;
    extra?: ReactNode;
    hidden?: boolean;
    hiddenValue?: string;
    icon?: IconName;
    label: string;
    loading?: boolean;
    value?: string;
    valueClassName?: string;
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
        <Icon size={5} name={hidden ? 'eye' : 'eye-slash'} />
    </Button>
);

/* When passed both children and a value prop:
 * children will be rendered, value will be passed
 * to ClickToCopy */
export const ValueControl = <E extends ElementType = 'div'>({
    actions,
    actionsContainerClassName,
    as,
    children,
    clickToCopy = false,
    clipboardValue,
    ellipsis = true,
    error = false,
    extra,
    hidden = false,
    hiddenValue,
    icon,
    label,
    loading = false,
    onClick,
    value,
    valueClassName,
}: ValueControlProps<E>) => {
    /* we're leveraging type-safety at the consumer level - we're recasting
     * the `as` prop as a generic `ElementType` to avoid switching over all
     * possible sub-types. Trade-off is being extra careful with the children
     * the `ValueContainer` can accept */
    const ValueContainer = (as ?? 'div') as ElementType;
    const intrinsicEl = isIntrinsicElement(ValueContainer);

    const [hide, setHide] = useState(hidden);
    const defaultHiddenValue = '••••••••••••';

    const displayValue = useMemo(() => {
        /* intrinsinc elements support nesting custom DOM structure */
        if (intrinsicEl && loading) return <div className="pass-skeleton pass-skeleton--value" />;
        if (intrinsicEl && !value && !children) return <div className="color-weak">{c('Info').t`None`}</div>;

        if (hide) return hiddenValue ?? defaultHiddenValue;

        /* if children are passed: display them - when working with
         * a `ValueContainer` component, we leverage the inherited prop
         * type-safety */
        if (children) return children;

        /* if no children provided: fallback to value which is always
         * a valid "string" ReactNode */
        return value ?? '';
    }, [value, children, loading, hide, intrinsicEl]);

    const canCopy = clickToCopy && value;
    const interactive = canCopy || onClick;
    const MaybeClickToCopy: ElementType<ClickToCopyProps> = canCopy ? ClickToCopy : 'div';

    return (
        <MaybeClickToCopy
            className={clsx(
                interactive && 'pass-value-control--interactive cursor-pointer',
                !loading && error && 'border-danger'
            )}
            {...(canCopy ? { value: clipboardValue ?? value } : { onClick })}
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
                <div className="color-weak text-sm">{label}</div>

                <ValueContainer
                    key={`${hide ? 'hidden' : 'visible'}-container`}
                    className={clsx(
                        'pass-value-control--value m-0 p-0 cursor-pointer',
                        ellipsis && 'text-ellipsis',
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
