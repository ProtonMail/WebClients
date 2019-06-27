import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import useToggle from '../toggle/useToggle';
import Input from '../input/Input';
import IconButton from '../button/IconButton';

const EditableText = ({ icon, onSubmit, initialText, children, readOnly, ...rest }) => {
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
                    <IconButton icon="on" type="submit" className="ml0-5" title={c('Action').t`Confirm`} />
                </>
            )}
            <IconButton icon="close" onClick={toggleEditing} className="ml0-5" title={c('Action').t`Close`} />
        </form>
    ) : (
        <>
            {initialText === null ? '--' : initialText}
            {!readOnly && (
                <IconButton icon={icon} onClick={toggleEditing} className="ml0-5" title={c('Action').t`Toggle edit`} />
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
    small: PropTypes.bool
};

EditableText.defaultProps = {
    readOnly: false,
    icon: 'compose',
    initialText: ''
};

export default EditableText;
