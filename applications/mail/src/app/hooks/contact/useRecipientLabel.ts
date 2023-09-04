import { Recipient } from '@proton/shared/lib/interfaces';

import {
    getRecipientGroupLabel as computeRecipientGroupLabel,
    getRecipientLabel as computeRecipientLabel,
    getRecipientLabelDetailed as computeRecipientLabelDetailed,
    recipientsToRecipientOrGroup,
} from '../../helpers/message/messageRecipients';
import { RecipientGroup, RecipientOrGroup } from '../../models/address';
import {
    useContactGroupsMap,
    useContactsMap,
    useGroupsLabelCache,
    useGroupsWithContactsMap,
    useRecipientsLabelCache,
} from './useContacts';

const getRecipientKey = (recipient: Recipient, detailed = false) =>
    `${recipient.Address}-${recipient.Name}-${detailed}`;

const getGroupKey = (recipientGroup: RecipientGroup) =>
    `${recipientGroup.group?.Path}-${recipientGroup.recipients
        .map((recipient) => getRecipientKey(recipient))
        .join('-')}`;

export const useRecipientLabel = () => {
    const contactsMap = useContactsMap();
    const contactGroupsMap = useContactGroupsMap();
    const groupsWithContactsMap = useGroupsWithContactsMap();
    const recipientsLabelCache = useRecipientsLabelCache();
    const groupsLabelCache = useGroupsLabelCache();

    const getRecipientLabel = (recipient: Recipient | undefined, detailed = false): string => {
        if (!recipient) {
            return '';
        }
        const recipientKey = getRecipientKey(recipient, detailed);
        return recipientsLabelCache[recipientKey]
            ? (recipientsLabelCache[recipientKey] as string)
            : (detailed ? computeRecipientLabelDetailed : computeRecipientLabel)(recipient, contactsMap);
    };

    const getGroupLabel = (recipientGroup: RecipientGroup | undefined, isShortName = false): string => {
        if (!recipientGroup) {
            return '';
        }
        const recipientGroupKey = getGroupKey(recipientGroup);
        return groupsLabelCache[recipientGroupKey]
            ? (groupsLabelCache[recipientGroupKey] as string)
            : computeRecipientGroupLabel(
                  recipientGroup,
                  groupsWithContactsMap[recipientGroup.group?.ID || '']?.contacts.length,
                  isShortName
              );
    };

    const getRecipientOrGroupLabel = ({ recipient, group }: RecipientOrGroup, detailed = false): string =>
        recipient ? getRecipientLabel(recipient, detailed) : getGroupLabel(group as RecipientGroup);

    const getRecipientsOrGroupsLabels = (recipientsOrGroups: RecipientOrGroup[], detailed = false): string[] =>
        recipientsOrGroups.map((recipientsOrGroups) => getRecipientOrGroupLabel(recipientsOrGroups, detailed));

    const getRecipientsOrGroups = (recipients: Recipient[], alwaysShowRecipient = false): RecipientOrGroup[] =>
        recipientsToRecipientOrGroup(recipients, contactGroupsMap, alwaysShowRecipient);

    return {
        getRecipientLabel,
        getGroupLabel,
        getRecipientOrGroupLabel,
        getRecipientsOrGroupsLabels,
        getRecipientsOrGroups,
    };
};
