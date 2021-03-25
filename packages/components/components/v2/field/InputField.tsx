import React from 'react';

import { Box, PolymorphicComponentProps } from '../../../helpers/react-polymorphic-box';
import Icon from '../../icon/Icon';
import { classnames, generateUID } from '../../../helpers';
import { useInstance } from '../../../hooks';
import Input from '../input/Input';

type ErrorProp = React.ReactNode | boolean;

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
    error?: ErrorProp;
    rootClassName?: string;
}

export type InputFieldProps<E extends React.ElementType> = PolymorphicComponentProps<E, OwnProps>;

const defaultElement = Input;

const InputField: <E extends React.ElementType = typeof defaultElement>(
    props: InputFieldProps<E>
) => React.ReactElement | null = React.forwardRef(
    <E extends React.ElementType = typeof defaultElement>(
        { label, hint, assistiveText, disabled, bigger, error, id: idProp, rootClassName, ...rest }: InputFieldProps<E>,
        ref: typeof rest.ref
    ) => {
        const id = useInstance(() => idProp || generateUID());

        const classes = {
            root: classnames([
                'inputform-container w100',
                rootClassName,
                disabled && 'inputform-container--disabled',
                Boolean(error) && 'inputform-container--invalid',
                bigger && 'inputform-container--bigger',
            ]),
            labelContainer: 'flex inputform-label flex-justify-space-between flex-nowrap flex-align-items-end',
            inputContainer: 'inputform-field-container relative',
        };

        const hintElement = hint && <div className="inputform-label-hint flex-item-noshrink">{hint}</div>;

        const errorElement = error && (
            <>
                <Icon name="exclamation-circle-filled" className="aligntop mr0-25" />
                <span>{error}</span>
            </>
        );

        return (
            <label className={classes.root} htmlFor={id}>
                <div className={classes.labelContainer}>
                    <span className="inputform-label-text">{label}</span>
                    {hintElement}
                </div>
                <div className={classes.inputContainer}>
                    <Box as={defaultElement} ref={ref} id={id} error={error} disabled={disabled} {...rest} />
                </div>
                <div className="inputform-assist flex">{errorElement || <>{assistiveText}</>}</div>
            </label>
        );
    }
);

export default InputField;
