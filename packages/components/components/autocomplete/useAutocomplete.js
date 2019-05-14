import { useState } from 'react';

const defaultItemToLabel = (label) => label;

const useAutocomplete = ({
    multiple = true,
    initialSelectedItems = [],
    initialInputValue = '',
    labelToItem = defaultItemToLabel
} = {}) => {
    const [selectedItems, setSelectedItems] = useState(initialSelectedItems);
    const [inputValue, changeInputValue] = useState(initialInputValue);

    const select = (item, label) => {
        changeInputValue(multiple ? '' : label);

        const itemToAdd = !item && label ? labelToItem(label) : item;
        setSelectedItems((selected) => (multiple ? [...selected, itemToAdd] : [itemToAdd]));
    };

    const submit = (label) => select(null, label);

    const deselect = (index) => {
        setSelectedItems((selected) => selected.filter((_, i) => i !== index));
    };

    return {
        changeInputValue,
        selectedItems,
        inputValue,
        submit,
        select,
        deselect
    };
};

export default useAutocomplete;
