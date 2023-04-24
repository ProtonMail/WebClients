import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { ModalProps, Prompt } from '@proton/components/components';
import { useContactGroups } from '@proton/components/hooks';
import { ContactGroup } from '@proton/shared/lib/interfaces/contacts';

const getContactGroupsNames = (groupIDs: string[], contactGroups: ContactGroup[]) => {
    return contactGroups.filter((contactGroup) => groupIDs.includes(contactGroup.ID));
};

export interface ContactGroupLimitReachedProps {
    groupIDs?: string[];
}

type Props = ContactGroupLimitReachedProps & ModalProps;
const ContactGroupLimitReachedModal = ({ groupIDs, ...rest }: Props) => {
    const [groups = []] = useContactGroups();

    const onClose = rest.onClose;

    const text =
        groupIDs && groupIDs?.length > 0
            ? c('Info')
                  .t`Contact groups can contain 100 contacts maximum. Contacts could not be added to the following groups:`
            : c('Info').t`Cannot add more than 100 contacts to a contact group.`;

    return (
        <Prompt
            title={c('Title').t`Contacts limit reached`}
            onClose={onClose}
            buttons={<Button onClick={onClose}>{c('Action').t`Close`}</Button>}
            {...rest}
        >
            <p>{text}</p>
            {groupIDs && groupIDs?.length > 0 && (
                <ul>
                    {getContactGroupsNames(groupIDs, groups).map((group) => (
                        <li>{group.Name}</li>
                    ))}
                </ul>
            )}
        </Prompt>
    );
};

export default ContactGroupLimitReachedModal;
