import * as React from 'react';

import { Box, PolymorphicComponentProps } from '../../../helpers/react-polymorphic-box';
import Icon from '../../icon/Icon';
import { classnames, generateUID } from '../../../helpers';
import { useInstance } from '../../../hooks';
import Input from '../input/Input';

type NodeOrBoolean = React.ReactNode | boolean;

// TODO: Add required child props to the as component
/*
interface RequiredChildProps {
    id?: string;
    error: ErrorProp;
    disabled?: boolean;
    disableChange?: boolean;
}
 */

export interface OwnProps {
    label?: React.ReactNode;
    hint?: React.ReactNode;
    assistiveText?: React.ReactNode;
    disabled?: boolean;
    bigger?: boolean;
    id?: string;
    error?: NodeOrBoolean;
    warning?: NodeOrBoolean;
    rootClassName?: string;
}

export type InputFieldProps<E extends React.ElementType> = PolymorphicComponentProps<E, OwnProps>;

const defaultElement = Input;

const InputField: <E extends React.ElementType = typeof defaultElement>(
    props: InputFieldProps<E>
) => React.ReactElement | null = React.forwardRef(
    <E extends React.ElementType = typeof defaultElement>(
        {
            label,
            hint,
            assistiveText,
            disabled,
            bigger,
            error,
            id: idProp,
            rootClassName,
            warning,
            ...rest
        }: InputFieldProps<E>,
        ref: typeof rest.ref
    ) => {
        const id = useInstance(() => idProp || generateUID());
        const assistiveUid = useInstance(() => generateUID());

        const classes = {
            root: classnames([
                'inputform-container w100',
                rootClassName,
                disabled && 'inputform-container--disabled',
                Boolean(error) && 'inputform-container--invalid',
                !error && Boolean(warning) && 'inputform-container--warning',
                bigger && 'inputform-container--bigger',
            ]),
            labelContainer: 'flex inputform-label flex-justify-space-between flex-nowrap flex-align-items-end',
            inputContainer: 'inputform-field-container relative',
        };

        const hintElement = hint && <div className="inputform-label-hint flex-item-noshrink">{hint}</div>;

        const labelElement = label && <span className="inputform-label-text">{label}</span>;

        const errorElement = error && typeof error !== 'boolean' && (
            <>
                <Icon name="exclamation-circle-filled" className="aligntop mr0-25" />
                <span>{error}</span>
            </>
        );
        const warningElement = warning && typeof warning !== 'boolean' && (
            <>
                <Icon name="exclamation-circle-filled" className="aligntop mr0-25" />
                <span>{warning}</span>
            </>
        );

        return (
            <label className={classes.root} htmlFor={id}>
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
                    />
                </div>
                <div className="inputform-assist flex" id={assistiveUid}>
                    {errorElement || warningElement || (!error && !warning) && assistiveText}
                </div>
            </label>
        );
    }
);

export default InputField;
