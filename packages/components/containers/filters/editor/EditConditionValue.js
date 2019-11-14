import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Input, Button } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

function EditConditionValue({ value, onClickDelete = noop, onEdit = noop }) {
    const handleClick = () => onClickDelete();
    const handleInput = ({ target }) => onEdit(target.value);

    return (
        <div className="flex flex-nowrap mb1" data-info={c('Filter condition').t`Or`}>
            <Input className="mr1" onInput={handleInput} value={value} />
            <Button className="flex-item-noshrink" onClick={handleClick}>{c('Action').t`Delete`}</Button>
        </div>
    );
}

EditConditionValue.propTypes = {
    className: PropTypes.string,
    value: PropTypes.string.isRequired,
    onEdit: PropTypes.func.isRequired,
    onClickDelete: PropTypes.func.isRequired
};

export default EditConditionValue;
