import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Icon, Input } from 'react-components';
import { c } from 'ttag';
import useToggle from '../toggle/useToggle';

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
                    <Button type="submit" className={`ml0-5 pm-button--for-icon`} title={c('Action').t`Confirm`}>
                        <Icon name="on" />
                    </Button>
                </>
            )}
            <Button onClick={toggleEditing} className={`ml0-5 pm-button--for-icon`} title={c('Action').t`Close`}>
                <Icon name="close" />
            </Button>
        </form>
    ) : (
        <>
            {initialText === null ? '--' : initialText}
            {!readOnly && (
                <Button
                    onClick={toggleEditing}
                    className={`ml0-5 pm-button--for-icon`}
                    title={c('Action').t`Toggle edit`}
                >
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
    small: PropTypes.bool
};

EditableText.defaultProps = {
    readOnly: false,
    icon: 'compose',
    initialText: ''
};

export default EditableText;
