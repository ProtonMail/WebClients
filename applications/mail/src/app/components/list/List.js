import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useLabels } from 'react-components';

import Item from './Item';

const List = ({ labelID, elementID, mailSettings = {}, elements = [], checkedIDs = [], onCheck, onClick }) => {
    const [labels] = useLabels();
    const [lastChecked, setLastChecked] = useState(); // Store ID of the last contact ID checked

    const handleCheck = ({ target, nativeEvent }) => {
        const { shiftKey } = nativeEvent;
        const elementID = target.getAttribute('data-element-id');
        const elementIDs = [elementID];

        if (lastChecked && shiftKey) {
            const start = elements.findIndex(({ ID }) => ID === elementID);
            const end = elements.findIndex(({ ID }) => ID === lastChecked);
            elementIDs.push(...elements.slice(Math.min(start, end), Math.max(start, end) + 1).map(({ ID }) => ID));
        }

        setLastChecked(elementID);
        onCheck(elementIDs, target.checked);
    };

    return (
        <div className="items-column-list scroll-if-needed scroll-smooth-touch">
            {elements.map((element) => {
                return (
                    <Item
                        labels={labels}
                        labelID={labelID}
                        key={element.ID}
                        elementID={elementID}
                        element={element}
                        checked={checkedIDs.includes(element.ID)}
                        onCheck={handleCheck}
                        onClick={onClick}
                        mailSettings={mailSettings}
                    />
                );
            })}
        </div>
    );
};

List.propTypes = {
    labelID: PropTypes.string.isRequired,
    elementID: PropTypes.string,
    mailSettings: PropTypes.object.isRequired,
    elements: PropTypes.array,
    checkedIDs: PropTypes.array,
    onCheck: PropTypes.func,
    onClick: PropTypes.func
};

export default List;
