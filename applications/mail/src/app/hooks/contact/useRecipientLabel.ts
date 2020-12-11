import { Recipient } from 'proton-shared/lib/interfaces';

import { RecipientOrGroup, RecipientGroup } from '../../models/address';
import {
    getRecipientLabel as computeRecipientLabel,
    getRecipientLabelDetailed as computeRecipientLabelDetailed,
    getRecipientGroupLabel as computeRecipientGroupLabel,
    recipientsToRecipientOrGroup,
} from '../../helpers/addresses';
import { useContactCache } from '../../containers/ContactProvider';

const getRecipientKey = (recipient: Recipient, detailed = false) =>
    `${recipient.Address}-${recipient.Name}-${detailed}`;

const getGroupKey = (recipientGroup: RecipientGroup) =>
    `${recipientGroup.group?.Path}-${recipientGroup.recipients
        .map((recipient) => getRecipientKey(recipient))
        .join('-')}`;

export const useRecipientLabel = () => {
    const {
        contactsMap,
        contactGroupsMap,
        groupsWithContactsMap,
        recipientsLabelCache,
        groupsLabelCache,
    } = useContactCache();

    const getRecipientLabel = (recipient: Recipient | undefined, detailed = false) => {
        if (!recipient) {
            return '';
        }
        const recipientKey = getRecipientKey(recipient, detailed);
        return recipientsLabelCache.has(recipientKey)
            ? (recipientsLabelCache.get(recipientKey) as string)
            : (detailed ? computeRecipientLabel : computeRecipientLabelDetailed)(recipient, contactsMap);
    };

    const getGroupLabel = (recipientGroup: RecipientGroup | undefined) => {
        if (!recipientGroup) {
            return '';
        }
        const recipientGroupKey = getGroupKey(recipientGroup);
        return groupsLabelCache.has(recipientGroupKey)
            ? (groupsLabelCache.get(recipientGroupKey) as string)
            : computeRecipientGroupLabel(
                  recipientGroup,
                  groupsWithContactsMap[recipientGroup.group?.ID || '']?.contacts.length
              );
    };

    const getRecipientOrGroupLabel = ({ recipient, group }: RecipientOrGroup, detailed = false) =>
        recipient ? getRecipientLabel(recipient, detailed) : getGroupLabel(group as RecipientGroup);

    const getRecipientsOrGroupsLabels = (recipientsOrGroups: RecipientOrGroup[], detailed = false) =>
        recipientsOrGroups.map((recipientsOrGroups) => getRecipientOrGroupLabel(recipientsOrGroups, detailed));

    const getRecipientsOrGroups = (recipients: Recipient[]) =>
        recipientsToRecipientOrGroup(recipients, contactGroupsMap);

    return {
        getRecipientLabel,
        getGroupLabel,
        getRecipientOrGroupLabel,
        getRecipientsOrGroupsLabels,
        getRecipientsOrGroups,
    };
};
