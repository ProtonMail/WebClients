import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import type { IconName } from '@proton/icons/types';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import useToggle from '../../hooks/useToggle';
import Input, { type Props as InputProps } from '../input/Input';

interface Props extends Omit<InputProps, 'icon' | 'children' | 'onSubmit'> {
    onSubmit: (value: string) => void;
    onCancel?: () => void;
    initialText?: string;
    readOnly?: boolean;
    children?: (props: { submit: (value: string) => void; toggleEditing: () => void }) => React.ReactNode;
    icon?: IconName;
    small?: boolean;
    formClassName?: string;
}

const EditableText = ({
    icon = 'pen',
    onSubmit,
    onCancel = noop,
    initialText = '',
    children,
    readOnly = false,
    formClassName = '',
    ...rest
}: Props) => {
    const [inputValue, setInputValue] = useState(initialText);
    const { state: editing, toggle: toggleEditing, set: setEditing } = useToggle();

    useEffect(() => {
        if (editing) {
            setInputValue(initialText);
        }
    }, [editing, initialText]);

    const submit = (value: string) => {
        onSubmit(value);
        setEditing(false);
    };

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        submit(inputValue);
    };

    const handleChangeInputValue = ({ target }: React.ChangeEvent<HTMLInputElement>) => setInputValue(target.value);

    return editing ? (
        <form className={clsx('flex', formClassName)} onSubmit={handleFormSubmit}>
            {children ? (
                children({ submit, toggleEditing })
            ) : (
                <>
                    <div className="flex">
                        <Input autoFocus value={inputValue} onChange={handleChangeInputValue} {...rest} />
                    </div>
                    <Button icon type="submit" className="ml-2" title={c('Action').t`Confirm`}>
                        <Icon name="checkmark" alt={c('Action').t`Confirm`} />
                    </Button>
                </>
            )}
            <Button
                icon
                onClick={() => {
                    toggleEditing();
                    onCancel();
                }}
                className="ml-2"
                title={c('Action').t`Close`}
            >
                <Icon name="cross" alt={c('Action').t`Close`} />
            </Button>
        </form>
    ) : (
        <>
            {initialText === null ? '--' : initialText}
            {!readOnly && (
                <Button icon onClick={toggleEditing} className="ml-2" title={c('Action').t`Toggle edit`}>
                    <Icon name={icon} />
                </Button>
            )}
        </>
    );
};

export default EditableText;
