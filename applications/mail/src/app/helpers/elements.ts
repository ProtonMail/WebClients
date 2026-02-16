import { formatRelative, fromUnixTime } from 'date-fns';
import type { Location } from 'history';

import { isCustomLabel } from '@proton/mail/helpers/location';
import { CATEGORY_LABEL_IDS_SET, type CategoryLabelID, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { canonicalizeEmailByGuess } from '@proton/shared/lib/helpers/email';
import { omit, toMap } from '@proton/shared/lib/helpers/object';
import type { Address } from '@proton/shared/lib/interfaces';
import type { Folder } from '@proton/shared/lib/interfaces/Folder';
import type { Label, LabelCount } from '@proton/shared/lib/interfaces/Label';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { CUSTOM_VIEWS_LABELS } from '@proton/shared/lib/mail/constants';
import {
    getSender,
    getRecipients as messageGetRecipients,
    hasAttachments as messageHasAttachments,
    numAttachments as messageNumAttachments,
} from '@proton/shared/lib/mail/messages';
import type { Filter, SearchParameters, Sort } from '@proton/shared/lib/mail/search';
import diff from '@proton/utils/diff';
import unique from '@proton/utils/unique';

import { ELEMENT_TYPES } from '../constants';
import type { Conversation } from '../models/conversation';
import type { Element } from '../models/element';
import type { LabelIDsChanges } from '../models/event';
import {
    getLabelIDs as conversationGetLabelIDs,
    getSenders as conversationGetSenders,
    getTime as conversationGetTime,
    hasAttachments as conversationHasAttachments,
    isUnread as conversationIsUnread,
    getNumAttachments as conversationNumAttachments,
    getLabelsSetForConversation,
} from './conversation';
import { isConversationMode } from './mailSettings';
import { getLabelsSetForMessage } from './message';
import { getSnoozeDate } from './snooze';

export interface TypeParams {
    labelID?: string;
    mailSettings: any;
    location: Location;
}

interface ContextIdentifier {
    labelID: string;
    conversationMode: boolean;
    filter?: Filter;
    sort?: Sort;
    from?: string;
    to?: string;
    address?: string;
    begin?: number;
    end?: number;
    keyword?: string;
    newsletterSubscriptionID?: string;
}

export const getCurrentType = ({ labelID, mailSettings, location }: TypeParams) =>
    isConversationMode(labelID, mailSettings, location) ? ELEMENT_TYPES.CONVERSATION : ELEMENT_TYPES.MESSAGE;

export const isElementMessage = (element: Element | undefined): element is Message =>
    typeof (element as Message)?.ConversationID === 'string';
export const isElementConversation = (element: Element | undefined): element is Conversation =>
    !isElementMessage(element);

/**
 * Get the date of an element.
 * @param element
 * @param labelID is only used for a conversation. Yet mandatory not to forget to consider its use.
 */
export const getDate = (element: Element | undefined, labelID: string | undefined) => {
    if (!element) {
        return new Date();
    }

    const time = isElementMessage(element) ? element.Time : conversationGetTime(element, labelID);

    return new Date((time || 0) * 1000);
};

/**
 * Get readable time to display from message / conversation
 * @param element.Time
 * @return Jan 17, 2016
 */
export const getReadableTime = (element: Element | undefined, labelID: string | undefined) =>
    formatRelative(getDate(element, labelID), new Date());

/**
 * Return if the element is to be considered in read or unread status
 * @param element
 * @param labelID is only used for a conversation. Yet mandatory not to forget to consider its use.
 */
export const isUnread = (element: Element | undefined, labelID: string | undefined) => {
    if (!element) {
        return false;
    }

    if (isElementMessage(element)) {
        return element.Unread !== 0;
    }

    return conversationIsUnread(element, labelID);
};

export const isUnreadMessage = (message: Message) => isUnread(message, undefined);

export const getLabelIDs = (element: Element | undefined, contextLabelID: string | undefined) =>
    isElementMessage(element)
        ? element?.LabelIDs?.reduce<{ [labelID: string]: boolean | undefined }>((acc, labelID) => {
              acc[labelID] = true;
              return acc;
          }, {}) || {}
        : conversationGetLabelIDs(element, contextLabelID);

export const getLabelsSetForElement = (element: Element | undefined): Set<string> => {
    if (!element) {
        return new Set();
    }

    if (isElementMessage(element)) {
        return getLabelsSetForMessage(element);
    }

    return getLabelsSetForConversation(element);
};

// TODO this method should be improved, we test if the value is present in an object even if it's false
// getLabelIDs({ 'inbox': false }, 'inbox') would return true with the current logic. It's hacky.
export const hasLabel = (element: Element | undefined, labelID: string) =>
    getLabelIDs(element, undefined)[labelID] !== undefined;

export const isStarred = (element: Element) => hasLabel(element, MAILBOX_LABEL_IDS.STARRED);

export const isInDeletedFolder = (isRetentionPoliciesEnabled?: boolean, labelID?: string): boolean =>
    !!(isRetentionPoliciesEnabled && labelID === MAILBOX_LABEL_IDS.SOFT_DELETED);

export const getSize = (element: Element) => element.Size || 0;

export const sort = (elements: Element[], sort: Sort, labelID: string) => {
    const getValue = {
        Time: (element: Element, labelID: string) => getDate(element, labelID).getTime(),
        Size: getSize,
        SnoozeTime: (element: Element) => getSnoozeDate(element, labelID).getTime(),
    }[sort.sort] as any;
    const compare = (a: Element, b: Element) => {
        let valueA = getValue(a, labelID);
        let valueB = getValue(b, labelID);
        if (valueA === valueB && sort.sort === 'Time') {
            valueA = a.Order || 0;
            valueB = b.Order || 0;
        }
        return sort.desc ? valueB - valueA : valueA - valueB;
    };
    return [...elements].sort((e1, e2) => compare(e1, e2));
};

export const hasAttachments = (element: Element) =>
    isElementMessage(element) ? messageHasAttachments(element) : conversationHasAttachments(element);

export const getNumAttachments = (element: Element) =>
    isElementMessage(element) ? messageNumAttachments(element) : conversationNumAttachments(element);

/**
 * Starting from the element LabelIDs list, add and remove labels from an event manager event
 */
export const parseLabelIDsInEvent = <T extends Element>(element: T, changes: T & LabelIDsChanges): T => {
    const omitted = omit(changes, ['LabelIDsRemoved', 'LabelIDsAdded']);
    if (isElementMessage(element)) {
        if (omitted?.LabelIDs) {
            return { ...element, ...omitted };
        }
        const LabelIDs = unique(
            diff((element as Message).LabelIDs || [], changes.LabelIDsRemoved || []).concat(changes.LabelIDsAdded || [])
        );
        return { ...element, ...omitted, LabelIDs };
    }
    // Conversation don't use LabelIDs even if these properties are still present in update events
    // The conversation.Labels object is fully updated each time so we can safely ignore them
    return { ...element, ...omitted };
};

export const isSearch = (searchParams: SearchParameters) =>
    !!searchParams.address ||
    !!searchParams.begin ||
    !!searchParams.end ||
    !!searchParams.from ||
    !!searchParams.keyword ||
    !!searchParams.to ||
    !!searchParams.wildcard;

export const isEmpty = (filter: Filter) => !Object.keys(filter).length;

export const hasAttachmentsFilter = (filter?: Filter) => filter?.Attachments === 1;

/**
 * Get the IDs of the folder where the element is currently located
 */
export const getCurrentFolderIDs = (element: Element | undefined, customFoldersList: Folder[]): string[] => {
    const labelIDs = getLabelIDs(element, undefined);
    const standardFolders: { [labelID: string]: boolean } = {
        [MAILBOX_LABEL_IDS.INBOX]: true,
        [MAILBOX_LABEL_IDS.TRASH]: true,
        [MAILBOX_LABEL_IDS.SPAM]: true,
        [MAILBOX_LABEL_IDS.SENT]: true,
        [MAILBOX_LABEL_IDS.DRAFTS]: true,
        [MAILBOX_LABEL_IDS.ARCHIVE]: true,
        [MAILBOX_LABEL_IDS.SCHEDULED]: true,
        [MAILBOX_LABEL_IDS.SNOOZED]: true,
    };
    const customFolders = toMap(customFoldersList, 'ID');
    return Object.keys(labelIDs).filter((labelID) => standardFolders[labelID] || customFolders[labelID]) || '';
};

export const getSenders = (element: Element) => {
    if (isElementMessage(element)) {
        return [getSender(element)];
    }
    return conversationGetSenders(element as Conversation);
};

export const getRecipients = (element: Element) => {
    if (isElementMessage(element)) {
        return messageGetRecipients(element);
    }
    return (element as Conversation).Recipients || [];
};

export const getAddressID = (element: Element) => {
    if (isElementMessage(element)) {
        return element.AddressID;
    }
    // Default to empty string for conversations
    return '';
};

export const getFirstSenderAddress = (element: Element) => {
    const senders = getSenders(element);
    const [sender] = senders;
    const { Address = '' } = sender || {};
    return Address;
};

export const getLocationElementsCount = (
    labelID: string,
    conversationsCount: LabelCount[],
    messagesCount: LabelCount[],
    conversationMode: boolean
) => {
    if (conversationMode && conversationsCount && conversationsCount.length > 0) {
        return conversationsCount.find((conversationCount) => labelID === conversationCount.LabelID)?.Total || 0;
    } else if (messagesCount && messagesCount.length > 0) {
        return messagesCount.find((messageCount) => labelID === messageCount.LabelID)?.Total || 0;
    }
    return 0;
};

export const matchFrom = (element: Element, fromInput: string) => {
    const senders = getSenders(element);
    const cleanedInput = fromInput.toLowerCase();
    return senders.some((sender) => {
        const senderAddress = (sender?.Address || '').toLowerCase();
        const senderName = (sender?.Name || '').toLowerCase();
        // We have to match "sender+alias@protonmail.com" with "sender@alias.com" as search input. So we need to canonicalize the email
        // However, we also need to match "sender+alias@protonmail.com" with "alias" search input. So we need to check that the search input is included in the sender
        return (
            canonicalizeEmailByGuess(senderAddress).includes(canonicalizeEmailByGuess(cleanedInput)) ||
            senderAddress.includes(cleanedInput) ||
            senderName.includes(cleanedInput)
        );
    });
};

export const matchTo = (element: Element, toInput: string) => {
    const recipients = getRecipients(element);
    const cleanedInput = toInput.toLowerCase();
    return recipients.some((recipient) => {
        const recipientAddress = (recipient?.Address || '').toLowerCase();
        const recipientName = (recipient?.Name || '').toLowerCase();
        // We have to match "recipient+alias@protonmail.com" with "recipient@alias.com" as search input. So we need to canonicalize the email
        // However, we also need to match "recipient+alias@protonmail.com" with "alias" search input. So we need to check that the search input is included in the recipient
        return (
            canonicalizeEmailByGuess(recipientAddress).includes(canonicalizeEmailByGuess(cleanedInput)) ||
            recipientAddress.includes(cleanedInput) ||
            recipientName.includes(cleanedInput)
        );
    });
};

export const matchBegin = (element: Element, labelID: string, begin: number) => {
    return getDate(element, labelID) >= fromUnixTime(begin);
};

export const matchEnd = (element: Element, labelID: string, end: number) => {
    return getDate(element, labelID) <= fromUnixTime(end);
};

export const matchAddressID = (element: Element, addressID: string) => {
    return getAddressID(element) === addressID;
};

export const filterElementsInState = ({
    elements,
    bypassFilter,
    labelID,
    filter,
    conversationMode,
    search,
    newsletterSubscriptionID,
    disabledCategoriesIDs,
}: {
    elements: Element[];
    addresses?: Address[];
    bypassFilter: string[];
    labelID: string;
    filter: Filter;
    conversationMode: boolean;
    search: SearchParameters;
    newsletterSubscriptionID?: string;
    disabledCategoriesIDs?: string[];
}) => {
    const bypassFilterSet = new Set(bypassFilter);
    const isCurrentLabelDefaultCategory = labelID === MAILBOX_LABEL_IDS.CATEGORY_DEFAULT;
    const isCurrentLabelCategory = CATEGORY_LABEL_IDS_SET.has(labelID as CategoryLabelID);

    return elements.filter((element) => {
        // Check ID and label first (cheapest operations)

        // If unread status is correct OR the element can bypass filters, continue
        // Else, we can filter out the item
        const elementUnread = isUnread(element, labelID);
        const elementCorrectUnreadStatus =
            filter.Unread === undefined || (filter.Unread === 1 ? elementUnread : !elementUnread);
        const elementCanBypassFilter = bypassFilterSet.has(element.ID || '');
        if (!(elementCorrectUnreadStatus || elementCanBypassFilter)) {
            return false;
        }

        // Creates the map of label IDs only once instead of using `hasLabel` that would create multiple maps
        const labelIDsSet = getLabelsSetForElement(element);

        // Exclude SOFT_DELETED elements from all folders except the Deleted folder itself
        if (labelID !== MAILBOX_LABEL_IDS.SOFT_DELETED && labelIDsSet.has(MAILBOX_LABEL_IDS.SOFT_DELETED)) {
            return false;
        }

        // Check if element has a disabled category label (only relevant for default category view)
        const elementContainsDisabledCategoryLabel =
            isCurrentLabelDefaultCategory &&
            disabledCategoriesIDs?.some((id) => labelIDsSet.has(id)) &&
            labelIDsSet.has(MAILBOX_LABEL_IDS.INBOX);

        // Elements in a category but not in inbox should be filtered when viewing a category
        const isElementInCategoryButNotInbox = isCurrentLabelCategory && !labelIDsSet.has(MAILBOX_LABEL_IDS.INBOX);

        if (
            (!labelIDsSet.has(labelID) || isElementInCategoryButNotInbox) &&
            !elementContainsDisabledCategoryLabel &&
            labelID !== CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS
        ) {
            return false;
        }

        if (conversationMode ? !isElementConversation(element) : !isElementMessage(element)) {
            return false;
        }

        if (
            labelID === CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS &&
            isElementMessage(element) &&
            // Note: This only filters messages. We don't expect conversations but if there are Conversations in newsletter context (if any exist)
            // would not be filtered by subscription ID here.
            (newsletterSubscriptionID !== (element as Message).NewsletterSubscriptionID ||
                //we need to filter out elements that are in newsletter subscriptions but not in almost all mail
                !labelIDsSet.has(MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL))
        ) {
            return false;
        }

        // Check simple filters
        if (filter.Attachments === 1 && !hasAttachments(element)) {
            return false;
        }

        // More expensive email address checks
        if (search.from && !matchFrom(element, search.from)) {
            return false;
        }
        if (search.to && !matchTo(element, search.to)) {
            return false;
        }
        if (search.address && !matchAddressID(element, search.address)) {
            return false;
        }

        // Date checks last (usually most expensive due to date operations)
        if (search.end && !matchEnd(element, labelID, search.end)) {
            return false;
        }
        if (search.begin && !matchBegin(element, labelID, search.begin)) {
            return false;
        }

        return true;
    });
};

export const getElementContextIdentifier = (contextFilter: ContextIdentifier) => {
    // For search queries, exclude newsletterSubscriptionID from the context to avoid
    // creating separate contexts for the same search across different newsletter subscriptions
    const isSearchQuery =
        !!contextFilter.keyword ||
        !!contextFilter.from ||
        !!contextFilter.to ||
        !!contextFilter.address ||
        !!contextFilter.begin ||
        !!contextFilter.end;

    return JSON.stringify({
        labelID: contextFilter.labelID,
        conversationMode: contextFilter.conversationMode,
        filter: contextFilter.filter,
        sort: contextFilter.sort,
        from: contextFilter.from,
        to: contextFilter.to,
        address: contextFilter.address,
        begin: contextFilter.begin,
        end: contextFilter.end,
        keyword: contextFilter.keyword,
        newsletterSubscriptionID: isSearchQuery ? undefined : contextFilter.newsletterSubscriptionID,
    });
};

export const parseElementContextIdentifier = (contextIdentifier: string): ContextIdentifier | null => {
    try {
        return JSON.parse(contextIdentifier);
    } catch (error) {
        console.error('Error parsing context identifier', error);
        return null;
    }
};

export const getSearchParameters = (contextIdentifier: ContextIdentifier): SearchParameters => {
    return {
        address: contextIdentifier.address || '',
        from: contextIdentifier.from || '',
        to: contextIdentifier.to || '',
        begin: contextIdentifier.begin || 0,
        end: contextIdentifier.end || 0,
        keyword: contextIdentifier.keyword || '',
    };
};

export const isElementOutsideFolders = (element: Element, labels: Label[]): boolean => {
    const elementLabelIDs = Object.keys(getLabelIDs(element, undefined));

    // Filter out labels that are NOT considered folders (custom or system)
    const folderLabelIDs = elementLabelIDs.filter((labelID) => {
        const isStarred = labelID === MAILBOX_LABEL_IDS.STARRED;
        const isAllMail = labelID === MAILBOX_LABEL_IDS.ALL_MAIL;
        const isAlmostAllMail = labelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL;

        return !isCustomLabel(labelID, labels) && !isStarred && !isAllMail && !isAlmostAllMail;
    });

    // If no folder-related labels remain, the element is outside of folders
    return folderLabelIDs.length === 0;
};
