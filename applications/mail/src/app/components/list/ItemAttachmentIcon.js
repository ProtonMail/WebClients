import React from 'react';
import PropTypes from 'prop-types';
import { Icon, classnames } from 'react-components';

import { ELEMENT_TYPES } from '../../constants';
import { hasAttachments } from '../../helpers/message';

const ItemAttachmentIcon = ({ element = {}, type = ELEMENT_TYPES.CONVERSATION, className }) => {
    const isConversation = type === ELEMENT_TYPES.CONVERSATION;
    const hasAttachment = isConversation ? element.ContextNumAttachments : hasAttachments(element);

    if (!hasAttachment) {
        return null;
    }

    return <Icon name="attach" fill="" className={classnames(['fill-global-success', className])} />;
};

ItemAttachmentIcon.propTypes = {
    element: PropTypes.object,
    type: PropTypes.oneOf([ELEMENT_TYPES.CONVERSATION, ELEMENT_TYPES.MESSAGE]).isRequired,
    className: PropTypes.string
};

export default ItemAttachmentIcon;
