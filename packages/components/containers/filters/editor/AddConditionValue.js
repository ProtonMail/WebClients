import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Input, Button } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

function AddCondtionValue({ value = '', onEdit = noop, onAdd = noop }) {
    const handleAdd = () => onAdd(null);

    // keyDown as it won't trigger the submit event ;)
    const handleKeyDown = (e) => {
        if (e.key !== 'Enter') {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        handleAdd();
    };

    const handleInput = ({ target }) => onEdit(target.value === '' ? null : target.value);

    return (
        <div className="flex flex-nowrap">
            <Input
                id="textOrPattern"
                value={value === null ? '' : value}
                className="mr1"
                onKeyDown={handleKeyDown}
                onInput={handleInput}
                placeholder={c('Info').t`Text or pattern`}
            />
            <Button className="flex-item-noshrink" disabled={!value} onClick={handleAdd}>{c('Action').t`Add`}</Button>
        </div>
    );
}

AddCondtionValue.propTypes = {
    value: PropTypes.string,
    onAdd: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired
};

export default AddCondtionValue;
