import { ElementType, forwardRef, ReactElement, ReactNode, useContext, useState } from 'react';
import useInstance from '@proton/hooks/useInstance';
import { Box, PolymorphicComponentProps } from '../../../helpers/react-polymorphic-box';
import Icon from '../../icon/Icon';
import { classnames, generateUID } from '../../../helpers';
import Input from '../input/Input';
import { Tooltip } from '../../tooltip';
import { FormContext } from '../../../components';

type NodeOrBoolean = ReactNode | boolean;

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
    bigger?: boolean;
    dense?: boolean;
    id?: string;
    error?: NodeOrBoolean;
    warning?: NodeOrBoolean;
    rootClassName?: string;
    labelContainerClassName?: string;
    assistContainerClassName?: string;
}

export type InputFieldProps<E extends ElementType> = PolymorphicComponentProps<E, InputFieldOwnProps>;
export const errorClassName = 'inputform-container--invalid';

const defaultElement = Input;

const InputFieldBase = <E extends ElementType = typeof defaultElement>(
    {
        label,
        hint,
        assistiveText,
        disabled,
        bigger,
        dense: denseProp,
        error,
        id: idProp,
        rootClassName,
        labelContainerClassName,
        assistContainerClassName,
        warning,
        ...rest
    }: InputFieldProps<E>,
    ref: typeof rest.ref
) => {
    const [isFocused, setIsFocused] = useState(false);
    const { dense } = useContext(FormContext) || {};
    const id = useInstance(() => idProp || generateUID());
    const assistiveUid = useInstance(() => generateUID());
    const isDense = denseProp || dense;
    const classes = {
        root: classnames([
            'inputform-container w100',
            isDense && 'inputform-container--dense',
            rootClassName,
            disabled && 'inputform-container--disabled',
            Boolean(error) && errorClassName,
            !error && Boolean(warning) && 'inputform-container--warning',
            bigger && 'inputform-container--bigger',
        ]),
        labelContainer: classnames([
            'flex inputform-label flex-justify-space-between flex-nowrap flex-align-items-end',
            labelContainerClassName,
        ]),
        inputContainer: 'inputform-field-container relative',
        assistContainer: classnames([
            'inputform-assist flex flex-nowrap',
            assistContainerClassName,
            isDense && 'sr-only',
        ]),
    };
    const hintElement = hint && <div className="inputform-label-hint flex-item-noshrink">{hint}</div>;
    const labelElement = label && <span className="inputform-label-text">{label}</span>;

    const errorElement = error && typeof error !== 'boolean' && (
        <>
            <Icon name="exclamation-circle-filled" className="flex-item-noshrink aligntop mr0-25" />
            <span>{error}</span>
        </>
    );
    const warningElement = warning && typeof warning !== 'boolean' && (
        <>
            <Icon name="exclamation-circle-filled" className="flex-item-noshrink aligntop mr0-25" />
            <span>{warning}</span>
        </>
    );

    const getIcon = () => {
        if (isDense && (error || warning)) {
            const { tooltipType, iconClassName, title } = error
                ? { tooltipType: 'error' as const, iconClassName: 'color-danger', title: error }
                : { tooltipType: 'warning' as const, iconClassName: 'color-warning', title: warning };

            return (
                <Tooltip
                    title={title}
                    type={tooltipType}
                    anchorOffset={{ y: -4, x: 0 }}
                    isOpen={isFocused && !rest.value}
                >
                    <Icon name="exclamation-circle-filled" className={iconClassName} />
                </Tooltip>
            );
        }

        return rest.icon;
    };

    return (
        <label
            className={classes.root}
            htmlFor={id}
            onFocus={() => {
                setIsFocused(true);
            }}
            onBlur={() => {
                setIsFocused(false);
            }}
        >
            {(label || hint) && (
                <div className={classes.labelContainer}>
                    {labelElement}
                    {hintElement}
                </div>
            )}
            <div className={classes.inputContainer}>
                <Box
                    as={defaultElement}
                    ref={ref}
                    id={id}
                    error={error}
                    disabled={disabled}
                    aria-describedby={assistiveUid}
                    {...rest}
                    icon={getIcon()}
                />
            </div>
            <div className={classes.assistContainer} id={assistiveUid}>
                {errorElement || warningElement || (!error && !warning && assistiveText)}
            </div>
        </label>
    );
};

/*
export because of
https://github.com/storybookjs/storybook/issues/9511
https://github.com/styleguidist/react-docgen-typescript/issues/314
https://github.com/styleguidist/react-docgen-typescript/issues/215
*/
export const InputField: <E extends ElementType = typeof defaultElement>(
    props: InputFieldProps<E>
) => ReactElement | null = forwardRef(InputFieldBase);

export default InputField;
