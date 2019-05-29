import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Icon, SmallButton, Autocomplete, useAutocomplete } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

function LabelActions({ selection, labels, onChange }) {
    const itemMapper = (label) => ({
        label: label.Name,
        value: label
    });

    const { changeInputValue, selectedItems, inputValue, select, deselect } = useAutocomplete({
        multiple: true,
        initialSelectedItems: selection,
        onChange(selection) {
            onChange(selection.map(({ Name }) => Name));
        }
    });

    return (
        <>
            <input />
            <Autocomplete
                placeholder={c('Placeholder').t`Add a label ...`}
                inputValue={inputValue}
                onSelect={select}
                onInputValueChange={changeInputValue}
                data={itemMapper}
                list={labels}
                minChars={1}
            />

            <ul className="m0 mt1 mb1 p0">
                {selectedItems.map(({ Color, Name }, i) => {
                    const className = 'flex '.concat(i ? 'mt0-5' : '');
                    return (
                        <li key={Name} className={className}>
                            <Icon name="label" style={{ fill: Color }} className="mr1" alt={Name} />
                            <span>{Name}</span>
                            <SmallButton onClick={() => deselect(i)} className="mlauto">{c('Action')
                                .t`Remove`}</SmallButton>
                        </li>
                    );
                })}
            </ul>
        </>
    );
}

LabelActions.propTypes = {
    selection: PropTypes.array,
    labels: PropTypes.array,
    onChange: PropTypes.func
};

LabelActions.defaultProps = {
    selection: [],
    labels: [],
    onChange: noop
};

export default LabelActions;
