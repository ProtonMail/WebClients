import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Icon, SmallButton, Autocomplete, useAutocomplete } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

function LabelActions({ selection = [], labels = [], onChange = noop }) {
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
            <Autocomplete
                placeholder={c('Placeholder').t`Add a label...`}
                inputValue={inputValue}
                onSelect={select}
                onInputValueChange={changeInputValue}
                data={itemMapper}
                list={labels}
                minChars={1}
            />

            <ul className="m0 mt1 mb1 p0">
                {selectedItems.map(({ Color, Name }, i) => {
                    return (
                        <li key={Name} className="flex flex-nowrap flex-items-center mb0-5">
                            <Icon name="label" style={{ fill: Color }} className="flex-item-noshrink mr1" alt={Name} />
                            <span title={Name} className="ellipsis">
                                {Name}
                            </span>
                            <SmallButton
                                title={c('Action').t`Remove`}
                                icon="close"
                                onClick={() => deselect(i)}
                                className="mlauto"
                            />
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

export default LabelActions;
