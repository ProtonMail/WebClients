import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'react-components';

import { ELEMENT_TYPES } from '../../constants';

const ItemAttachmentIcon = ({ element = {}, type = ELEMENT_TYPES.CONVERSATION }) => {
    const isConversation = type === ELEMENT_TYPES.CONVERSATION;
    const hasAttachment = isConversation ? element.NumAttachments : element.HasAttachment;

    if (!hasAttachment) {
        return null;
    }

    return <Icon name="attach" />;
};

ItemAttachmentIcon.propTypes = {
    element: PropTypes.object,
    type: PropTypes.oneOf([ELEMENT_TYPES.CONVERSATION, ELEMENT_TYPES.MESSAGE]).isRequired
};

export default ItemAttachmentIcon;
