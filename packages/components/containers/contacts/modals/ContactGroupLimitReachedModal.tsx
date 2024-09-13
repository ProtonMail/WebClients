import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import type { ModalProps } from '@proton/components/components';
import Prompt from '@proton/components/components/prompt/Prompt';
import { useContactGroups } from '@proton/components/hooks';
import type { ContactGroup } from '@proton/shared/lib/interfaces/contacts';

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
            ? c('Info').t`You've reached the maximum number of addresses in the contact group(s):`
            : c('Info').t`You've reached the maximum number of addresses in the contact group.`;

    return (
        <Prompt
            title={c('Title').t`Cannot add more addresses`}
            onClose={onClose}
            buttons={<Button onClick={onClose}>{c('Action').t`Close`}</Button>}
            {...rest}
        >
            <p>{text}</p>
            {groupIDs && groupIDs?.length > 0 && (
                <ul>
                    {getContactGroupsNames(groupIDs, groups).map((group) => (
                        <li key={group.ID}>{group.Name}</li>
                    ))}
                </ul>
            )}
        </Prompt>
    );
};

export default ContactGroupLimitReachedModal;
