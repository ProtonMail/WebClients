import React, { MouseEvent } from 'react';
import { Icon, useLoading, useApi, useEventManager, classnames } from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { labelMessages, unlabelMessages } from 'proton-shared/lib/api/messages';
import { labelConversations, unlabelConversations } from 'proton-shared/lib/api/conversations';

import { Element } from '../../models/element';
import { isConversation as isConversationTest, isStarred as testIsStarred } from '../../helpers/elements';

interface Props {
    element?: Element;
}

const ItemStar = ({ element = {} }: Props) => {
    const api = useApi();
    const isConversation = isConversationTest(element);
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const isStarred = testIsStarred(element);
    const iconName = isStarred ? 'starfull' : 'star';

    const handleClick = async (e: MouseEvent) => {
        e.stopPropagation();

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
        <button
            disabled={loading}
            type="button"
            className={classnames([
                'starbutton item-star inline-flex stop-propagation',
                isStarred && 'starbutton--is-starred'
            ])}
            onClick={(e) => withLoading(handleClick(e))}
        >
            <Icon name={iconName} />
        </button>
    );
};

export default ItemStar;
