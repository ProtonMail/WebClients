import { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { c } from 'ttag';

import { Button } from '@proton/atoms/';
import Icon from '@proton/components/components/icon/Icon';

import useToggle from '../../hooks/useToggle';
import Input from '../input/Input';

const EditableText = ({ icon = 'pen', onSubmit, initialText = '', children, readOnly = false, ...rest }) => {
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
                    <Button icon type="submit" className="ml-2" title={c('Action').t`Confirm`}>
                        <Icon name="checkmark" alt={c('Action').t`Confirm`} />
                    </Button>
                </>
            )}
            <Button icon onClick={toggleEditing} className="ml-2" title={c('Action').t`Close`}>
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

EditableText.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    initialText: PropTypes.string,
    readOnly: PropTypes.bool,
    children: PropTypes.func,
    icon: PropTypes.string,
    small: PropTypes.bool,
};

export default EditableText;
