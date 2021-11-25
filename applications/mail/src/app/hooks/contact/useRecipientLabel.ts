import { Recipient } from '@proton/shared/lib/interfaces';

import { RecipientOrGroup, RecipientGroup } from '../../models/address';
import {
    getRecipientLabel as computeRecipientLabel,
    getRecipientLabelDetailed as computeRecipientLabelDetailed,
    getRecipientGroupLabel as computeRecipientGroupLabel,
    recipientsToRecipientOrGroup,
} from '../../helpers/addresses';
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
            : (detailed ? computeRecipientLabel : computeRecipientLabelDetailed)(recipient, contactsMap);
    };

    const getGroupLabel = (recipientGroup: RecipientGroup | undefined): string => {
        if (!recipientGroup) {
            return '';
        }
        const recipientGroupKey = getGroupKey(recipientGroup);
        return groupsLabelCache[recipientGroupKey]
            ? (groupsLabelCache[recipientGroupKey] as string)
            : computeRecipientGroupLabel(
                  recipientGroup,
                  groupsWithContactsMap[recipientGroup.group?.ID || '']?.contacts.length
              );
    };

    const getRecipientOrGroupLabel = ({ recipient, group }: RecipientOrGroup, detailed = false): string =>
        recipient ? getRecipientLabel(recipient, detailed) : getGroupLabel(group as RecipientGroup);

    const getRecipientsOrGroupsLabels = (recipientsOrGroups: RecipientOrGroup[], detailed = false): string[] =>
        recipientsOrGroups.map((recipientsOrGroups) => getRecipientOrGroupLabel(recipientsOrGroups, detailed));

    const getRecipientsOrGroups = (recipients: Recipient[]): RecipientOrGroup[] =>
        recipientsToRecipientOrGroup(recipients, contactGroupsMap);

    return {
        getRecipientLabel,
        getGroupLabel,
        getRecipientOrGroupLabel,
        getRecipientsOrGroupsLabels,
        getRecipientsOrGroups,
    };
};
