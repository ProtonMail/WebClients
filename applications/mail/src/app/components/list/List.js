import React from 'react';
import PropTypes from 'prop-types';
import { useLabels } from 'react-components';

import Item from './Item';

const List = ({ labelID, elementID, mailSettings = {}, elements = [], selectedIDs = [], onCheck }) => {
    const [labels] = useLabels();
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
                        checked={selectedIDs.includes(element.ID)}
                        onCheck={onCheck}
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
    selectedIDs: PropTypes.array,
    onCheck: PropTypes.func
};

export default List;
