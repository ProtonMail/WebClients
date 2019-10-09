import React from 'react';
import PropTypes from 'prop-types';
import { toMap } from 'proton-shared/lib/helpers/object';
import { orderBy } from 'proton-shared/lib/helpers/array';
import { Link } from 'react-router-dom';

import { ELEMENT_TYPES } from '../../constants';

const ItemLabels = ({ element, type = ELEMENT_TYPES.CONVERSATION, max = 99, labels = [] }) => {
    const isConversation = type === ELEMENT_TYPES.CONVERSATION;
    const labelIDs = isConversation ? element.Labels.map(({ ID }) => ID) : element.LabelIDs;
    const labelsMap = toMap(labels);

    return (
        <>
            {orderBy(labelIDs.map((ID) => labelsMap[ID]).filter(Boolean), 'Order')
                .slice(0, max)
                .map(({ ID = '', Name = '', Color = '' }) => {
                    const style = {
                        backgroundColor: Color,
                        borderColor: Color
                    };
                    const to = `/${ID}`;
                    return (
                        <Link to={to} className="badgeLabel" style={style} key={ID}>
                            {Name}
                        </Link>
                    );
                })}
        </>
    );
};

ItemLabels.propTypes = {
    element: PropTypes.object.isRequired,
    labels: PropTypes.array,
    max: PropTypes.number,
    type: PropTypes.oneOf([ELEMENT_TYPES.CONVERSATION, ELEMENT_TYPES.MESSAGE]).isRequired
};

export default ItemLabels;
