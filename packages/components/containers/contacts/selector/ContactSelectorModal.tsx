import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import Checkbox from '@proton/components/components/input/Checkbox';
import SearchInput from '@proton/components/components/input/SearchInput';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { toMap } from '@proton/shared/lib/helpers/object';
import { normalize } from '@proton/shared/lib/helpers/string';
import type { Recipient } from '@proton/shared/lib/interfaces/Address';
import type { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts/Contact';
import clsx from '@proton/utils/clsx';

import { useContactEmailsSortedByName, useUserSettings } from '../../../hooks';
import { useContactGroups } from '../../../hooks/useCategories';
import type { ContactEditProps } from '../edit/ContactEditModal';
import ContactSelectorEmptyContacts from './ContactSelectorEmptyContacts';
import ContactSelectorEmptyResults from './ContactSelectorEmptyResults';
import ContactSelectorList from './ContactSelectorList';
import ContactSelectorRow from './ContactSelectorRow';

import './ContactSelectorModal.scss';

const convertContactToRecipient = ({ Name, ContactID, Email }: ContactEmail) => ({
    Name,
    ContactID,
    Address: Email,
});

export interface ContactSelectorProps {
    inputValue: any;
    onGroupDetails: (contactGroupID: string) => void;
    onEdit: (props: ContactEditProps) => void;
}

interface ContactSelectorResolver {
    onResolve: (recipients: Recipient[]) => void;
    onReject: () => void;
}

const allContactsGroup = (): Pick<ContactGroup, 'Name' | 'ID'> => ({
    ID: 'default',
    Name: c('Label').t`All contacts`,
});

type Props = ContactSelectorProps & ContactSelectorResolver & ModalProps;

const ContactSelectorModal = ({ onResolve, onReject, inputValue, onGroupDetails, onEdit, ...rest }: Props) => {
    const { viewportWidth } = useActiveBreakpoint();

    const searchInputRef = useRef<HTMLInputElement>(null);
    const [contactEmails, loadingContactEmails] = useContactEmailsSortedByName();
    const [userSettings, loadingUserSettings] = useUserSettings();
    const [contactGroups = [], loadingContactGroups] = useContactGroups();
    const [selectedGroup, setSelectedGroup] = useState<string>(allContactsGroup().ID);

    const contactGroupsWithDefault = [allContactsGroup(), ...contactGroups];

    const emailsFromInput = inputValue.map((e: any) => e.Address);
    const contactGroupsMap = toMap(contactGroups);

    const initialCheckedContactEmailsMap = contactEmails.reduce(
        (acc: { [key: string]: boolean }, contactEmail: ContactEmail) => {
            acc[contactEmail.ID] = emailsFromInput.includes(contactEmail.Email);
            return acc;
        },
        Object.create(null)
    );

    const [searchValue, setSearchValue] = useState('');
    const [lastCheckedID, setLastCheckedID] = useState('');
    const [isAllChecked, setIsAllChecked] = useState(false);

    const [filteredContactEmails, setFilteredContactEmails] = useState(contactEmails);
    const [checkedContactEmailMap, setCheckedContactEmailMap] = useState<{ [key: string]: boolean }>(
        initialCheckedContactEmailsMap
    );
    const [checkedContactEmails, setCheckedContactEmails] = useState<ContactEmail[]>([]);
    const totalChecked = checkedContactEmails.length;

    const loading = loadingContactEmails || loadingUserSettings || loadingContactGroups;

    const toggleCheckAll = (checked: boolean) => {
        const update = filteredContactEmails.reduce((acc: { [key: string]: boolean }, contactEmail: ContactEmail) => {
            acc[contactEmail.ID] = checked;
            return acc;
        }, Object.create(null));

        setCheckedContactEmailMap({ ...checkedContactEmailMap, ...update });
    };

    const onCheck = (checkedIDs: string[] = [], checked = false) => {
        const update = checkedIDs.reduce((acc, checkedID) => {
            acc[checkedID] = checked;
            return acc;
        }, Object.create(null));

        setCheckedContactEmailMap({ ...checkedContactEmailMap, ...update });
    };

    const handleCheckAll = (e: ChangeEvent<HTMLInputElement>) => toggleCheckAll(e.target.checked);

    const handleCheck = (e: ChangeEvent<HTMLInputElement>, checkedID: string) => {
        const {
            target,
            nativeEvent,
        }: {
            target: EventTarget & HTMLInputElement;
            nativeEvent: Event & { shiftKey?: boolean };
        } = e;
        const checkedIDs = checkedID ? [checkedID] : [];

        if (lastCheckedID && nativeEvent.shiftKey) {
            const start = filteredContactEmails.findIndex((c: ContactEmail) => c.ID === checkedID);
            const end = filteredContactEmails.findIndex((c: ContactEmail) => c.ID === lastCheckedID);
            checkedIDs.push(
                ...filteredContactEmails
                    .slice(Math.min(start, end), Math.max(start, end) + 1)
                    .map((c: ContactEmail) => c.ID)
            );
        }

        if (checkedID) {
            setLastCheckedID(checkedID);
            onCheck(checkedIDs, target.checked);
        }
    };

    const handleClearSearch = () => {
        setSearchValue('');
        searchInputRef?.current?.focus();
    };

    const searchFilter = (c: ContactEmail) => {
        const tokenizedQuery = normalize(searchValue, true).split(' ');

        const groupNameTokens = c.LabelIDs.reduce((acc: string[], labelId) => {
            const tokenized = normalize(contactGroupsMap[labelId].Name, true).split(' ');
            return [...acc, ...tokenized];
        }, []);

        return (
            tokenizedQuery.some((token) => normalize(c.Name, true).includes(token)) ||
            tokenizedQuery.some((token) => normalize(c.Email, true).includes(token)) ||
            tokenizedQuery.some((token) => groupNameTokens.some((g) => g.includes(token)))
        );
    };

    const filterContactsByGroup = useMemo(() => {
        const filteredContacts = contactEmails;
        if (selectedGroup === allContactsGroup().ID) {
            return filteredContacts;
        }

        return filteredContacts.filter((contact: ContactEmail) => contact.LabelIDs.includes(selectedGroup));
    }, [selectedGroup]);

    useEffect(() => {
        searchInputRef?.current?.focus();
    }, []);

    useEffect(() => {
        setLastCheckedID('');
        setFilteredContactEmails(filterContactsByGroup.filter(searchFilter));
    }, [searchValue, selectedGroup]);

    useEffect(() => {
        setCheckedContactEmails(contactEmails.filter((c: ContactEmail) => !!checkedContactEmailMap[c.ID]));
    }, [checkedContactEmailMap]);

    useEffect(() => {
        setIsAllChecked(
            !!filteredContactEmails.length &&
                filteredContactEmails.every((c: ContactEmail) => !!checkedContactEmailMap[c.ID])
        );
    }, [filteredContactEmails, checkedContactEmailMap]);

    const handleSearchValue = (value: string) => setSearchValue(value);

    const handleSubmit = (event: FormEvent) => {
        event.stopPropagation();
        event.preventDefault();

        onResolve(checkedContactEmails.map(convertContactToRecipient));
        rest.onClose?.();
    };

    const actionText =
        totalChecked === 1
            ? c('Action').t`Insert contact`
            : c('Action').ngettext(
                  msgid`Insert ${totalChecked} contact`,
                  `Insert ${totalChecked} contacts`,
                  totalChecked
              );

    return (
        <ModalTwo size="large" as={Form} onSubmit={handleSubmit} data-testid="modal:contactlist" {...rest}>
            <ModalTwoHeader title={c('Title').t`Insert contacts`} />
            <ModalTwoContent>
                {!contactEmails.length ? (
                    <ContactSelectorEmptyContacts onClose={rest.onClose} onEdit={onEdit} />
                ) : (
                    <>
                        <div
                            className={clsx(['mb-2 flex flex-nowrap gap-4', viewportWidth['<=small'] && 'flex-column'])}
                        >
                            <div className="grow-2">
                                <SearchInput
                                    ref={searchInputRef}
                                    value={searchValue}
                                    onChange={handleSearchValue}
                                    placeholder={c('Placeholder').t`Search name, email or group`}
                                />
                            </div>
                            <div className={clsx([!viewportWidth['<=small'] && 'w-1/3'])}>
                                <SelectTwo
                                    onChange={({ value }) => setSelectedGroup(value)}
                                    value={selectedGroup}
                                    disabled={loadingContactGroups}
                                >
                                    {contactGroupsWithDefault.map((group) => (
                                        <Option key={group.ID} value={group.ID} title={group.Name}>
                                            {group.Name}
                                        </Option>
                                    ))}
                                </SelectTwo>
                            </div>
                        </div>
                        {filteredContactEmails.length ? (
                            <>
                                {!viewportWidth['<=small'] && (
                                    <div className="flex flex-nowrap flex-1 contact-list-row p-4">
                                        <div>
                                            <Checkbox
                                                className="w-full h-full"
                                                checked={isAllChecked}
                                                onChange={handleCheckAll}
                                            />
                                        </div>
                                        <div className="flex flex-1 self-center">
                                            <div className="w-custom pl-4" style={{ '--w-custom': '45%' }}>
                                                <strong className="text-uppercase">{c('Label').t`Name`}</strong>
                                            </div>
                                            <div className="flex-1">
                                                <strong className="text-uppercase">{c('Label').t`Email`}</strong>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <ContactSelectorList
                                    rowCount={filteredContactEmails.length}
                                    userSettings={userSettings}
                                    className={clsx([viewportWidth['<=small'] && 'mt-4'])}
                                    rowRenderer={({ index, style }) => (
                                        <ContactSelectorRow
                                            onCheck={handleCheck}
                                            style={style}
                                            key={filteredContactEmails[index].ID}
                                            contact={filteredContactEmails[index]}
                                            checked={!!checkedContactEmailMap[filteredContactEmails[index].ID]}
                                            isSmallViewport={viewportWidth['<=small']}
                                        />
                                    )}
                                />
                            </>
                        ) : (
                            <ContactSelectorEmptyResults onClearSearch={handleClearSearch} query={searchValue} />
                        )}
                    </>
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="button" onClick={rest.onClose} disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>
                {contactEmails.length ? (
                    <Button
                        color="norm"
                        loading={loading}
                        type="submit"
                        disabled={!totalChecked}
                        data-testid="modal:contactlist:submit"
                    >
                        {actionText}
                    </Button>
                ) : null}
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ContactSelectorModal;
