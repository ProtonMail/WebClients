import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Input, Button } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

function EditConditionValue({ value, onClickDelete = noop, onEdit = noop }) {
    const handleClick = () => onClickDelete(value);
    const handleInput = ({ target }) => onEdit({ before: value, value: target.value });

    return (
        <div className="flex flex-nowrap mb1" data-info={c('Filter condition').t`Or`}>
            <Input className="mr1" onInput={handleInput} value={value} />
            <Button onClick={handleClick}>{c('Action').t`Delete`}</Button>
        </div>
    );
}

EditConditionValue.propTypes = {
    className: PropTypes.string,
    value: PropTypes.string.isRequired,
    onEdit: PropTypes.func,
    onClickDelete: PropTypes.func
};

export default EditConditionValue;
