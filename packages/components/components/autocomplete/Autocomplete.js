import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { noop } from 'proton-shared/lib/helpers/function';
import Awesomplete from 'awesomplete';
import './Autocomplete.scss';
import { classnames } from '../../helpers/component';

/** @type any */
const Autocomplete = ({
    children,
    list = [],
    inputValue = '',
    placeholder = '',
    className = '',
    onKeyDown = noop,
    onSubmit = noop,
    onSelect = noop,
    onInputValueChange = noop,
    onOpen = noop,
    onClose = noop,
    onHighlight = noop,
    minChars,
    fieldClassName = '',
    ...rest
}) => {
    const [awesomplete, setAwesomplete] = useState();
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    const handleInputValueChange = ({ target }) => {
        onInputValueChange(target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(inputValue);
    };

    const handleSelect = ({ text }) => {
        onSelect(text.value, text.label);
    };

    const handleFocus = () => {
        if (inputValue.length >= minChars && awesomplete) {
            awesomplete.evaluate();
        }
    };

    const childrenCount = React.Children.count(children);
    const inputStyleModifier = childrenCount > 0 ? 'pm-field--tiny' : '';
    const dropdownListClasses = 'bg-white-dm w100 bordered-container m0 p0';

    useEffect(() => {
        const awesompleteInstance = new Awesomplete(inputRef.current, {
            container: () => containerRef.current,
            minChars,
            ...rest,
        });

        awesompleteInstance.ul.className = dropdownListClasses;

        setAwesomplete(awesompleteInstance);

        inputRef.current.addEventListener('awesomplete-selectcomplete', handleSelect);
        inputRef.current.addEventListener('awesomplete-close', onClose);
        inputRef.current.addEventListener('awesomplete-highlight', onHighlight);
        inputRef.current.addEventListener('awesomplete-open', onOpen);

        return () => {
            awesompleteInstance.destroy();
            inputRef.current.removeEventListener('awesomplete-selectcomplete', handleSelect);
            inputRef.current.removeEventListener('awesomplete-close', onClose);
            inputRef.current.removeEventListener('awesomplete-highlight', onHighlight);
            inputRef.current.removeEventListener('awesomplete-open', onOpen);
        };
    }, []);

    useEffect(() => {
        if (awesomplete) {
            awesomplete.list = list;

            if (awesomplete.isOpened) {
                awesomplete.evaluate();
            }
        }
    }, [awesomplete, list]);

    return (
        <div className={classnames(['autocomplete awesomplete w100', className])} onSubmit={handleSubmit}>
            <div className="autocomplete-container" ref={containerRef}>
                <div className={classnames(['flex pm-field', inputStyleModifier, fieldClassName])}>
                    {childrenCount > 0 && <div className="flex">{children}</div>}

                    <input
                        value={inputValue}
                        className="w100 flex autocomplete-input"
                        spellCheck={false}
                        autoComplete="off"
                        autoCapitalize="off"
                        placeholder={placeholder}
                        onChange={handleInputValueChange}
                        ref={inputRef}
                        onBlur={handleSubmit}
                        onKeyDown={onKeyDown}
                        onFocus={handleFocus}
                    />
                </div>
                {/* <ul> injected here by awesomplete */}
            </div>
        </div>
    );
};

Autocomplete.propTypes = {
    children: PropTypes.node,
    list: PropTypes.arrayOf(PropTypes.any),
    placeholder: PropTypes.string,
    className: PropTypes.string,
    inputValue: PropTypes.string,
    onInputValueChange: PropTypes.func,
    autoFirst: PropTypes.bool,
    onKeyDown: PropTypes.func,
    onSubmit: PropTypes.func,
    onSelect: PropTypes.func,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    onHighlight: PropTypes.func,
    minChars: PropTypes.number,
    maxItems: PropTypes.number,
    filter: PropTypes.func,
    data: PropTypes.func,
    fieldClassName: PropTypes.string,
};

export default Autocomplete;
