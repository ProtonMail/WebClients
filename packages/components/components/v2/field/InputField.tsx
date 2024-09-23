import type { ElementType, ForwardedRef, ReactNode, Ref } from 'react';
import React, { forwardRef, useContext, useRef, useState } from 'react';

import { isFocusable } from 'tabbable';

import { Input } from '@proton/atoms';
import { FormContext } from '@proton/components/components/form/Form';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import useInstance from '@proton/hooks/useInstance';
import type { PolymorphicForwardRefExoticComponent, PolymorphicPropsWithRef } from '@proton/react-polymorphic-types';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

import Icon from '../../icon/Icon';

export type NodeOrBoolean = ReactNode | boolean;

// TODO: Add required child props to the as component
/*
interface RequiredChildProps {
    id?: string;
    error: ErrorProp;
    disabled?: boolean;
    disableChange?: boolean;
}
 */

export interface InputFieldOwnProps {
    label?: ReactNode;
    hint?: ReactNode;
    assistiveText?: ReactNode;
    disabled?: boolean;
    disabledOnlyField?: boolean;
    bigger?: boolean;
    dense?: boolean;
    id?: string;
    error?: NodeOrBoolean;
    warning?: NodeOrBoolean;
    rootClassName?: string;
    rootStyle?: React.CSSProperties;
    rootRef?: Ref<HTMLDivElement>;
    labelContainerClassName?: string;
    assistContainerClassName?: string;
    inputContainerClassName?: string;
    'data-testid'?: string;
    readOnly?: boolean;
}

export type InputFieldProps<E extends ElementType> = PolymorphicPropsWithRef<InputFieldOwnProps, E>;
export const errorClassName = 'field-two--invalid';

const defaultElement = Input;

const InputFieldBase = <E extends ElementType = typeof defaultElement>(
    {
        label,
        hint,
        assistiveText,
        rootRef,
        disabled,
        disabledOnlyField,
        bigger,
        dense: denseProp,
        error,
        id: idProp,
        rootClassName,
        rootStyle,
        labelContainerClassName,
        assistContainerClassName,
        inputContainerClassName,
        warning,
        suffix,
        as,
        'data-testid': dataTestId,
        readOnly = false,
        ...rest
    }: InputFieldProps<E>,
    ref: ForwardedRef<Element>
) => {
    const [isFocused, setIsFocused] = useState(false);
    const { dense } = useContext(FormContext) || {};
    const id = useInstance(() => idProp || generateUID());
    const assistiveUid = useInstance(() => generateUID());
    const labelRef = useRef<HTMLLabelElement>(null);
    const isDense = denseProp || dense;
    const classes = {
        root: clsx([
            'field-two-container',
            isDense && 'field-two--dense',
            disabled && 'field-two--disabled',
            disabledOnlyField && 'field-two--disabled-only-field',
            Boolean(error) && errorClassName,
            Boolean(warning) && !error && 'field-two--warning',
            bigger && 'field-two--bigger',
            readOnly && 'field-two--readonly',
            rootClassName,
        ]),
        labelContainer: clsx([
            'field-two-label-container flex justify-space-between flex-nowrap items-end gap-2',
            labelContainerClassName,
        ]),
        inputContainer: clsx(['field-two-input-container relative', inputContainerClassName]),
        assistContainer: clsx([
            'field-two-assist flex flex-nowrap items-start',
            isDense && 'sr-only',
            assistContainerClassName,
        ]),
    };
    const labelElement = label && <span className="field-two-label">{label}</span>;
    const hintElement = hint && <span className="field-two-hint ml-auto">{hint}</span>;

    const errorElement = error && typeof error !== 'boolean' && (
        <>
            <Icon name="exclamation-circle-filled" className="shrink-0 mr-1" />
            <span data-testid={dataTestId ? `error-${dataTestId}` : undefined}>{error}</span>
        </>
    );
    const warningElement = warning && typeof warning !== 'boolean' && (
        <>
            <Icon name="exclamation-circle-filled" className="shrink-0 mr-1" />
            <span data-testid={dataTestId ? `warning-${dataTestId}` : undefined}>{warning}</span>
        </>
    );

    const getSuffix = () => {
        const denseSuffix = (() => {
            if (isDense && (error || warning)) {
                const { tooltipType, iconClassName, title } = error
                    ? { tooltipType: 'error' as const, iconClassName: 'color-danger', title: error }
                    : { tooltipType: 'warning' as const, iconClassName: 'color-warning', title: warning };

                // Force open it if the condition is true, otherwise leave it as undefined for the default handlers to deal with it
                const isTooltipOpen = isFocused && !rest.value ? true : undefined;
                return (
                    <Tooltip
                        openDelay={0}
                        closeDelay={250}
                        longTapDelay={0}
                        title={title}
                        type={tooltipType}
                        originalPlacement="top-end"
                        isOpen={isTooltipOpen}
                    >
                        <span className="flex shrink-0 p-1">
                            <Icon name="exclamation-circle-filled" className={iconClassName} />
                        </span>
                    </Tooltip>
                );
            }
        })();

        if (!denseSuffix && !suffix) {
            return undefined;
        }

        return (
            <>
                {denseSuffix}
                {suffix}
            </>
        );
    };

    const Element: ElementType = as || defaultElement;
    // Even if it's undefined we don't want to define the attribute since it will override spreading of rest.
    const testIdProps = dataTestId
        ? {
              'data-testid': dataTestId,
          }
        : undefined;

    return (
        <div
            className={classes.root}
            style={rootStyle}
            onFocus={() => {
                setIsFocused(true);
            }}
            onBlur={() => {
                setIsFocused(false);
            }}
            ref={rootRef}
        >
            {label || hint ? (
                <label htmlFor={id} className={classes.labelContainer} ref={labelRef}>
                    {labelElement}
                    {hintElement}
                </label>
            ) : (
                <label htmlFor={id} ref={labelRef} className="hidden" />
            )}
            <div className={classes.inputContainer}>
                <Element
                    ref={ref}
                    id={id}
                    error={error}
                    disabled={disabled}
                    aria-describedby={assistiveUid}
                    {...rest}
                    {...testIdProps}
                    suffix={getSuffix()}
                    readOnly={readOnly}
                />
            </div>

            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div
                className={classes.assistContainer}
                id={assistiveUid}
                onClick={(e) => {
                    // Ignore if it's empty or if the clicked target is focusable.
                    if (
                        (e.currentTarget === e.target && e.currentTarget.matches(':empty')) ||
                        isFocusable(e.target as Element)
                    ) {
                        return;
                    }
                    // Simulates this div being wrapped in a label. Clicks on the label element to trigger the normal
                    // click handler which the label would trigger.
                    labelRef.current?.click();
                }}
            >
                {errorElement || warningElement || (!error && !warning && assistiveText)}
            </div>
        </div>
    );
};

/*
export because of
https://github.com/storybookjs/storybook/issues/9511
https://github.com/styleguidist/react-docgen-typescript/issues/314
https://github.com/styleguidist/react-docgen-typescript/issues/215
*/
export const InputField: PolymorphicForwardRefExoticComponent<InputFieldOwnProps, typeof defaultElement> =
    forwardRef(InputFieldBase);

export default InputField;
