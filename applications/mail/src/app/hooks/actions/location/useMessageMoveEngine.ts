import { useFolders, useLabels } from '@proton/mail';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { MoveEngine } from './MoveEngine';
import { CUSTOM_FOLDER_KEY, CUSTOM_LABEL_KEY } from './moveEngineInterface';
import {
    allDraftRules,
    allMailRules,
    allSentRules,
    almostAllMailRules,
    archiveRules,
    categoryRules,
    customFolderRules,
    customLabelRules,
    draftRules,
    inboxRules,
    outboxRules,
    scheduleRules,
    sentRules,
    snoozedRules,
    spamRules,
    starredRules,
    trashRules,
} from './moveEngineRulesMessages';

export const useMessageMoveEngine = () => {
    const [folders = []] = useFolders();
    const [labels = []] = useLabels();

    const moveEngine = new MoveEngine(labels, folders);
    moveEngine.addRule(MAILBOX_LABEL_IDS.INBOX, inboxRules);
    moveEngine.addRule(MAILBOX_LABEL_IDS.ALL_DRAFTS, allDraftRules);
    moveEngine.addRule(MAILBOX_LABEL_IDS.ALL_SENT, allSentRules);
    moveEngine.addRule(MAILBOX_LABEL_IDS.TRASH, trashRules);
    moveEngine.addRule(MAILBOX_LABEL_IDS.SPAM, spamRules);
    moveEngine.addRule(MAILBOX_LABEL_IDS.ALL_MAIL, allMailRules);
    moveEngine.addRule(MAILBOX_LABEL_IDS.STARRED, starredRules);
    moveEngine.addRule(MAILBOX_LABEL_IDS.ARCHIVE, archiveRules);
    moveEngine.addRule(MAILBOX_LABEL_IDS.SENT, sentRules);
    moveEngine.addRule(MAILBOX_LABEL_IDS.DRAFTS, draftRules);
    moveEngine.addRule(MAILBOX_LABEL_IDS.OUTBOX, outboxRules);
    moveEngine.addRule(MAILBOX_LABEL_IDS.SCHEDULED, scheduleRules);
    moveEngine.addRule(MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, almostAllMailRules);
    moveEngine.addRule(MAILBOX_LABEL_IDS.SNOOZED, snoozedRules);
    moveEngine.addRule(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, categoryRules);
    moveEngine.addRule(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, categoryRules);
    moveEngine.addRule(MAILBOX_LABEL_IDS.CATEGORY_UPDATES, categoryRules);
    moveEngine.addRule(MAILBOX_LABEL_IDS.CATEGORY_FORUMS, categoryRules);
    moveEngine.addRule(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, categoryRules);
    moveEngine.addRule(MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS, categoryRules);
    moveEngine.addRule(MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS, categoryRules);

    moveEngine.addRule(CUSTOM_FOLDER_KEY, customFolderRules);
    moveEngine.addRule(CUSTOM_LABEL_KEY, customLabelRules);

    return moveEngine;
};
