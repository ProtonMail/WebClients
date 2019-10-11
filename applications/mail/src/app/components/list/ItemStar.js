import React from 'react';
import PropTypes from 'prop-types';
import { Icon, useLoading, useApi, useEventManager } from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { labelMessages, unlabelMessages } from 'proton-shared/lib/api/messages';
import { labelConversations, unlabelConversations } from 'proton-shared/lib/api/conversations';

import { ELEMENT_TYPES } from '../../constants';

const ItemStar = ({ element = {}, type = ELEMENT_TYPES.CONVERSATION }) => {
    const api = useApi();
    const isConversation = type === ELEMENT_TYPES.CONVERSATION;
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const labelIDs = isConversation ? element.Labels.map(({ ID }) => ID) : element.LabelIDs;
    const isStarred = labelIDs.includes(MAILBOX_LABEL_IDS.STARRED);
    const iconName = isStarred ? 'starfull' : 'star';

    const handleClick = async () => {
        const action = isConversation
            ? isStarred
                ? unlabelConversations
                : labelConversations
            : isStarred
            ? unlabelMessages
            : labelMessages;
        await api(action({ LabelID: MAILBOX_LABEL_IDS.STARRED, IDs: [element.ID] }));
        await call();
    };

    return (
        <button disabled={loading} type="button" className="starbutton flex" onClick={() => withLoading(handleClick())}>
            <Icon name={iconName} />
        </button>
    );
};

ItemStar.propTypes = {
    type: PropTypes.oneOf([ELEMENT_TYPES.CONVERSATION, ELEMENT_TYPES.MESSAGE]).isRequired,
    element: PropTypes.object.isRequired
};

export default ItemStar;
