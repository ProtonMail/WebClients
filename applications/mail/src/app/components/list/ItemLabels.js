import React from 'react';
import PropTypes from 'prop-types';
import { toMap } from 'proton-shared/lib/helpers/object';
import { orderBy } from 'proton-shared/lib/helpers/array';
import { Link } from 'react-router-dom';
import { Icon, classnames } from 'react-components';

import { ELEMENT_TYPES } from '../../constants';

const ItemLabels = ({
    element,
    onUnlabel,
    type = ELEMENT_TYPES.CONVERSATION,
    max = 99,
    labels = [],
    className = ''
}) => {
    const isConversation = type === ELEMENT_TYPES.CONVERSATION;
    const labelIDs = isConversation ? element.Labels.map(({ ID }) => ID) : element.LabelIDs;
    const labelsMap = toMap(labels);

    return (
        <div className={classnames(['inbl', className])}>
            {orderBy(labelIDs.map((ID) => labelsMap[ID]).filter(Boolean), 'Order')
                .slice(0, max)
                .map(({ ID = '', Name = '', Color = '' }) => {
                    const style = {
                        backgroundColor: Color,
                        borderColor: Color
                    };
                    const to = `/${ID}`;
                    return (
                        <span className="badgeLabel" style={style} key={ID}>
                            <Link to={to}>{Name}</Link>
                            {onUnlabel ? (
                                <button type="button" onClick={() => onUnlabel(ID)}>
                                    <Icon name="off" />
                                </button>
                            ) : null}
                        </span>
                    );
                })}
        </div>
    );
};

ItemLabels.propTypes = {
    element: PropTypes.object.isRequired,
    labels: PropTypes.array,
    max: PropTypes.number,
    onUnlabel: PropTypes.func,
    type: PropTypes.oneOf([ELEMENT_TYPES.CONVERSATION, ELEMENT_TYPES.MESSAGE]).isRequired,
    className: PropTypes.string
};

export default ItemLabels;
