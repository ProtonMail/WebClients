import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import {
    conversationAllDraftRules,
    conversationAllMailRules,
    conversationAllSentRules,
    conversationAlmostAllMailRules,
    conversationArchiveRules,
    conversationCategoryRules,
    conversationCustomFolderRules,
    conversationCustomLabelRules,
    conversationDraftRules,
    conversationInboxRules,
    conversationOutboxRules,
    conversationScheduleRules,
    conversationSentRules,
    conversationSnoozedRules,
    conversationSpamRules,
    conversationStarredRules,
    conversationTrashRules,
} from 'proton-mail/helpers/location/MoveEngine/moveEngineRulesConversations';
import {
    messageAllDraftRules,
    messageAllMailRules,
    messageAllSentRules,
    messageAlmostAllMailRules,
    messageArchiveRules,
    messageCategoryRules,
    messageCustomFolderRules,
    messageCustomLabelRules,
    messageDraftRules,
    messageInboxRules,
    messageOutboxRules,
    messageScheduleRules,
    messageSentRules,
    messageSnoozedRules,
    messageSoftDeletedRules,
    messageSpamRules,
    messageStarredRules,
    messageTrashRules,
} from 'proton-mail/helpers/location/MoveEngine/moveEngineRulesMessages';

import { MoveEngine } from './MoveEngine';
import { CUSTOM_FOLDER_KEY, CUSTOM_LABEL_KEY } from './moveEngineInterface';

export const useMoveEngine = () => {
    const [folders = []] = useFolders();
    const [labels = []] = useLabels();

    const messageMoveEngine = new MoveEngine(labels, folders);
    messageMoveEngine.addRule(MAILBOX_LABEL_IDS.INBOX, messageInboxRules);
    messageMoveEngine.addRule(MAILBOX_LABEL_IDS.ALL_DRAFTS, messageAllDraftRules);
    messageMoveEngine.addRule(MAILBOX_LABEL_IDS.ALL_SENT, messageAllSentRules);
    messageMoveEngine.addRule(MAILBOX_LABEL_IDS.TRASH, messageTrashRules);
    messageMoveEngine.addRule(MAILBOX_LABEL_IDS.SPAM, messageSpamRules);
    messageMoveEngine.addRule(MAILBOX_LABEL_IDS.ALL_MAIL, messageAllMailRules);
    messageMoveEngine.addRule(MAILBOX_LABEL_IDS.STARRED, messageStarredRules);
    messageMoveEngine.addRule(MAILBOX_LABEL_IDS.ARCHIVE, messageArchiveRules);
    messageMoveEngine.addRule(MAILBOX_LABEL_IDS.SENT, messageSentRules);
    messageMoveEngine.addRule(MAILBOX_LABEL_IDS.DRAFTS, messageDraftRules);
    messageMoveEngine.addRule(MAILBOX_LABEL_IDS.OUTBOX, messageOutboxRules);
    messageMoveEngine.addRule(MAILBOX_LABEL_IDS.SCHEDULED, messageScheduleRules);
    messageMoveEngine.addRule(MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, messageAlmostAllMailRules);
    messageMoveEngine.addRule(MAILBOX_LABEL_IDS.SNOOZED, messageSnoozedRules);
    messageMoveEngine.addRule(MAILBOX_LABEL_IDS.SOFT_DELETED, messageSoftDeletedRules);
    messageMoveEngine.addRule(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, messageCategoryRules);
    messageMoveEngine.addRule(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, messageCategoryRules);
    messageMoveEngine.addRule(MAILBOX_LABEL_IDS.CATEGORY_UPDATES, messageCategoryRules);
    messageMoveEngine.addRule(MAILBOX_LABEL_IDS.CATEGORY_FORUMS, messageCategoryRules);
    messageMoveEngine.addRule(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, messageCategoryRules);
    messageMoveEngine.addRule(MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS, messageCategoryRules);
    messageMoveEngine.addRule(MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS, messageCategoryRules);

    messageMoveEngine.addRule(CUSTOM_FOLDER_KEY, messageCustomFolderRules);
    messageMoveEngine.addRule(CUSTOM_LABEL_KEY, messageCustomLabelRules);

    const conversationMoveEngine = new MoveEngine(labels, folders);
    conversationMoveEngine.addRule(MAILBOX_LABEL_IDS.INBOX, conversationInboxRules);
    conversationMoveEngine.addRule(MAILBOX_LABEL_IDS.ALL_DRAFTS, conversationAllDraftRules);
    conversationMoveEngine.addRule(MAILBOX_LABEL_IDS.ALL_SENT, conversationAllSentRules);
    conversationMoveEngine.addRule(MAILBOX_LABEL_IDS.TRASH, conversationTrashRules);
    conversationMoveEngine.addRule(MAILBOX_LABEL_IDS.SPAM, conversationSpamRules);
    conversationMoveEngine.addRule(MAILBOX_LABEL_IDS.ALL_MAIL, conversationAllMailRules);
    conversationMoveEngine.addRule(MAILBOX_LABEL_IDS.STARRED, conversationStarredRules);
    conversationMoveEngine.addRule(MAILBOX_LABEL_IDS.ARCHIVE, conversationArchiveRules);
    conversationMoveEngine.addRule(MAILBOX_LABEL_IDS.SENT, conversationSentRules);
    conversationMoveEngine.addRule(MAILBOX_LABEL_IDS.DRAFTS, conversationDraftRules);
    conversationMoveEngine.addRule(MAILBOX_LABEL_IDS.OUTBOX, conversationOutboxRules);
    conversationMoveEngine.addRule(MAILBOX_LABEL_IDS.SCHEDULED, conversationScheduleRules);
    conversationMoveEngine.addRule(MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, conversationAlmostAllMailRules);
    conversationMoveEngine.addRule(MAILBOX_LABEL_IDS.SNOOZED, conversationSnoozedRules);
    conversationMoveEngine.addRule(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, conversationCategoryRules);
    conversationMoveEngine.addRule(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, conversationCategoryRules);
    conversationMoveEngine.addRule(MAILBOX_LABEL_IDS.CATEGORY_UPDATES, conversationCategoryRules);
    conversationMoveEngine.addRule(MAILBOX_LABEL_IDS.CATEGORY_FORUMS, conversationCategoryRules);
    conversationMoveEngine.addRule(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, conversationCategoryRules);
    conversationMoveEngine.addRule(MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS, conversationCategoryRules);
    conversationMoveEngine.addRule(MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS, conversationCategoryRules);

    conversationMoveEngine.addRule(CUSTOM_FOLDER_KEY, conversationCustomFolderRules);
    conversationMoveEngine.addRule(CUSTOM_LABEL_KEY, conversationCustomLabelRules);

    return { conversationMoveEngine, messageMoveEngine };
};
