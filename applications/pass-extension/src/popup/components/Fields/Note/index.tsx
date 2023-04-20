import { type VFC } from 'react';

import { InputFieldTwo, TextAreaTwo } from '@proton/components';

import { type InputControlProps } from '../../Controls/InputControl';
import { AbstractField, type AbstractFieldProps } from '../AbstractField';

type TitleInputProps = InputControlProps<typeof InputFieldTwo>;

export const NoteTitleField: VFC<AbstractFieldProps<TitleInputProps>> = (props) => {
    return (
        <AbstractField<TitleInputProps> {...props}>
            {(inputProps) => (
                <InputFieldTwo
                    dense
                    unstyled
                    assistContainerClassName="hidden-empty"
                    inputClassName="pass-title-field px-0 text-bold rounded-none"
                    labelContainerClassName="sr-only"
                    {...inputProps}
                />
            )}
        </AbstractField>
    );
};

type TextAreaProps = InputControlProps<typeof TextAreaTwo>;

export const NoteTextAreaField: VFC<AbstractFieldProps<TextAreaProps>> = (props) => {
    return (
        <AbstractField<TextAreaProps> {...props}>
            {(textAreaProps) => (
                <TextAreaTwo
                    unstyled
                    className="resize-none"
                    name="note"
                    minRows={10}
                    rows={Number.MAX_SAFE_INTEGER}
                    autoGrow
                    {...textAreaProps}
                />
            )}
        </AbstractField>
    );
};
