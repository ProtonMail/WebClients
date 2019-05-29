import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Row, Input, Button } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

function EditConditionValue({ value, onClickDelete, onEdit, className }) {
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
        <Row className={'EditConditionValue-container'.concat(className)} data-info={c('Filter condition').t`Or`}>
            <Input onKeyUp={handleKeyUp} onInput={handleInput} value={state} />
            <Button className="ml1" onClick={handleClick} type="button">{c('Action').t`Delete`}</Button>
        </Row>
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
