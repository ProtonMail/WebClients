import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Input, Button } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

function EditConditionValue({ value, onClickDelete, onEdit }) {
    const [state, setState] = useState(value);

    const handleClick = () => onClickDelete(value);
    const handleInput = ({ target }) => setState(target.value);
    const handleKeyUp = ({ key }) => {
        if (key !== 'Enter') {
            return;
        }
        onEdit({ before: value, value: state });
    };

    return (
        <div className="flex flex-nowrap mb1" data-info={c('Filter condition').t`Or`}>
            <Input onKeyUp={handleKeyUp} className="mr1" onInput={handleInput} value={state} />
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

EditConditionValue.defaultProps = {
    className: '',
    onEdit: noop,
    onClickDelete: noop
};

export default EditConditionValue;
