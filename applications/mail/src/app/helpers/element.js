import { MAILBOX_LABEL_IDS, VIEW_MODE } from 'proton-shared/lib/constants';

import { ELEMENT_TYPES } from '../constants';

const { SENT, ALL_SENT, DRAFTS, ALL_DRAFTS, ALL_MAIL } = MAILBOX_LABEL_IDS;

export const getCurrentType = ({ labelID = '', mailSettings = {} }) => {
    if ([SENT, ALL_SENT, DRAFTS, ALL_DRAFTS, ALL_MAIL].includes(labelID)) {
        return ELEMENT_TYPES.MESSAGE;
    }

    const { ViewMode = VIEW_MODE.GROUP } = mailSettings;
    return ViewMode === VIEW_MODE.GROUP ? ELEMENT_TYPES.CONVERSATION : ELEMENT_TYPES.MESSAGE;
};

export const isConversation = (data) => ELEMENT_TYPES.CONVERSATION === getCurrentType(data);
export const isMessage = (data) => ELEMENT_TYPES.MESSAGE === getCurrentType(data);
