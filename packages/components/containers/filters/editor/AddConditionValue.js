import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Input, Button } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

function AddCondtionValue({ onAdd = noop }) {
    const [state, setState] = useState('');

    const addEffect = () => {
        state && onAdd(state);
        setState('');
    };

    // keyDown as it won't trigger the submit event ;)
    const handleKeyDown = (e) => {
        if (e.key !== 'Enter') {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        addEffect();
    };

    const handleInput = ({ target }) => setState(target.value);
    const handleClick = addEffect;

    return (
        <div className="flex flex-nowrap">
            <Input
                id="textOrPattern"
                value={state}
                className="mr1"
                onKeyDown={handleKeyDown}
                onInput={handleInput}
                placeholder={c('Info').t`Text or pattern`}
            />
            <Button className="flex-item-noshrink" disabled={!state} onClick={handleClick}>{c('Action').t`Add`}</Button>
        </div>
    );
}

AddCondtionValue.propTypes = {
    onAdd: PropTypes.func
};

export default AddCondtionValue;
