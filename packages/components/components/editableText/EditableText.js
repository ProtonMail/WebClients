import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import useToggle from '../../hooks/useToggle';
import Input from '../input/Input';
import { Button } from '../button';
import { Icon } from '../icon';

const EditableText = ({ icon = 'compose', onSubmit, initialText = '', children, readOnly = false, ...rest }) => {
    const [inputValue, setInputValue] = useState(initialText);
    const { state: editing, toggle: toggleEditing, set: setEditing } = useToggle();

    useEffect(() => {
        if (editing) {
            setInputValue(initialText);
        }
    }, [editing, initialText]);

    const submit = (value) => {
        onSubmit(value);
        setEditing(false);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        submit(inputValue);
    };

    const handleChangeInputValue = ({ target }) => setInputValue(target.value);

    return editing ? (
        <form className="flex" onSubmit={handleFormSubmit}>
            {children ? (
                children({ submit, toggleEditing })
            ) : (
                <>
                    <div className="flex">
                        <Input autoFocus value={inputValue} onChange={handleChangeInputValue} {...rest} />
                    </div>
                    <Button icon type="submit" className="ml0-5" title={c('Action').t`Confirm`}>
                        <Icon name="on" />
                    </Button>
                </>
            )}
            <Button icon onClick={toggleEditing} className="ml0-5" title={c('Action').t`Close`}>
                <Icon name="close" />
            </Button>
        </form>
    ) : (
        <>
            {initialText === null ? '--' : initialText}
            {!readOnly && (
                <Button icon onClick={toggleEditing} className="ml0-5" title={c('Action').t`Toggle edit`}>
                    <Icon name={icon} />
                </Button>
            )}
        </>
    );
};

EditableText.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    initialText: PropTypes.string,
    readOnly: PropTypes.bool,
    children: PropTypes.func,
    icon: PropTypes.string,
    small: PropTypes.bool,
};

export default EditableText;
