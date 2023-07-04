import { ChangeEvent, FormEvent, useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button, Input } from '@proton/atoms';
import { getRandomAccentColor } from '@proton/shared/lib/colors';
import { hasReachedContactGroupMembersLimit } from '@proton/shared/lib/contacts/helpers/contactGroup';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts/Contact';
import diff from '@proton/utils/diff';
import isTruthy from '@proton/utils/isTruthy';

import {
    AddressesAutocompleteItem,
    Alert,
    Autocomplete,
    ColorPicker,
    Field,
    Label,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Row,
    getContactsAutocompleteItems,
} from '../../../components';
import { useContactEmails, useContactGroups, useMailSettings } from '../../../hooks';
import useUpdateGroup from '../hooks/useUpdateGroup';
import ContactGroupTable from './ContactGroupTable';

export interface ContactGroupEditProps {
    contactGroupID?: string;
    selectedContactEmails?: ContactEmail[];
    onDelayedSave?: (groupID: string) => void;
}

type Props = ContactGroupEditProps & ModalProps;

const ContactGroupEditModal = ({ contactGroupID, selectedContactEmails = [], onDelayedSave, ...rest }: Props) => {
    const [mailSettings] = useMailSettings();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [contactGroups = []] = useContactGroups();
    const [contactEmails] = useContactEmails();
    const [value, setValue] = useState('');
    const updateGroup = useUpdateGroup();
    const isValidEmail = useMemo(() => validateEmailAddress(value), [value]);

    const contactGroup = contactGroupID && contactGroups.find(({ ID }) => ID === contactGroupID);
    const existingContactEmails =
        contactGroupID &&
        contactEmails.filter(({ LabelIDs = [] }: { LabelIDs: string[] }) => LabelIDs.includes(contactGroupID));
    const title = contactGroupID ? c('Title').t`Edit contact group` : c('Title').t`Create new group`;

    const [model, setModel] = useState<{ name: string; color: string; contactEmails: ContactEmail[] }>({
        name: contactGroupID && contactGroup ? contactGroup.Name : '',
        color: contactGroupID && contactGroup ? contactGroup.Color : getRandomAccentColor(),
        contactEmails: contactGroupID ? existingContactEmails : selectedContactEmails,
    });
    const contactEmailIDs = model.contactEmails.map(({ ID }: ContactEmail) => ID);

    const canAddMoreContacts = hasReachedContactGroupMembersLimit(model.contactEmails.length, mailSettings);

    const contactsAutocompleteItems = useMemo(() => {
        return [...getContactsAutocompleteItems(contactEmails, ({ ID }) => !contactEmailIDs.includes(ID))];
    }, [contactEmails, contactEmailIDs]);

    const handleChangeName = ({ target }: ChangeEvent<HTMLInputElement>) => setModel({ ...model, name: target.value });
    const handleChangeColor = (color: string) => setModel({ ...model, color });

    const handleAdd = () => {
        if (!isValidEmail) {
            return;
        }
        setModel((model) => ({
            ...model,
            contactEmails: [...model.contactEmails, { Name: value, Email: value } as ContactEmail],
        }));
        setValue('');
    };

    const handleSelect = (newContactEmail: AddressesAutocompleteItem | string) => {
        if (!canAddMoreContacts) {
            setError(true);
            return;
        }

        if (typeof newContactEmail === 'string' || newContactEmail.type === 'major') {
            handleAdd();
        } else {
            const newContact = contactEmails.find((contact: ContactEmail) => contact.ID === newContactEmail.value.ID);
            if (newContact) {
                setModel((model) => ({
                    ...model,
                    contactEmails: [...model.contactEmails, newContact],
                }));
            }
            setValue('');
        }
        setError(false);
    };

    const handleAddContact = () => {
        if (!canAddMoreContacts) {
            setError(true);
            return;
        }

        handleAdd();
        setError(false);
    };

    const handleDeleteEmail = (contactEmail: string) => {
        const index = model.contactEmails.findIndex(({ Email }: ContactEmail) => Email === contactEmail);

        if (index > -1) {
            const copy = [...model.contactEmails];
            copy.splice(index, 1);
            setModel({ ...model, contactEmails: copy });
        }
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        event.stopPropagation();

        try {
            setLoading(true);
            const toAdd = model.contactEmails.filter(({ ID }) => isTruthy(ID));
            const toCreate = !onDelayedSave
                ? model.contactEmails.filter(({ ID }) => !isTruthy(ID))
                : // If delayed save, the contact we are editing does not really exists yet, so we need to remove it from the to create
                  model.contactEmails.filter(
                      (contactEmail) => !isTruthy(contactEmail.ID) && !selectedContactEmails?.includes(contactEmail)
                  );
            const toRemove = contactGroupID ? diff(existingContactEmails, toAdd) : [];

            await updateGroup({
                groupID: contactGroupID,
                name: model.name,
                color: model.color,
                toAdd,
                toRemove,
                toCreate,
                onDelayedSave,
            });

            rest.onClose?.();
        } catch (error: any) {
            setLoading(false);
            throw error;
        }
    };

    const contactEmailsLength = model.contactEmails.length;

    return (
        <ModalTwo size="large" className="contacts-modal" as="form" onSubmit={handleSubmit} {...rest}>
            <ModalTwoHeader title={title} />
            <ModalTwoContent>
                <Row>
                    <Label htmlFor="contactGroupName">{c('Label for contact group name').t`Name`}</Label>
                    <Field className="flex-item-fluid">
                        <Input
                            id="contactGroupName"
                            placeholder={c('Placeholder for contact group name').t`Name`}
                            value={model.name}
                            onChange={handleChangeName}
                        />
                    </Field>
                </Row>
                <Row>
                    <Label htmlFor="contactGroupColor">{c('Label for contact group color').t`Color`}</Label>
                    <Field className="w100">
                        <ColorPicker id="contactGroupColor" color={model.color} onChange={handleChangeColor} />
                    </Field>
                </Row>
                {contactsAutocompleteItems.length ? (
                    <div className="flex flex-nowrap mb-4 on-mobile-flex-column">
                        <Label htmlFor="contactGroupEmail">{c('Label').t`Add email address`}</Label>
                        <div>
                            <div className="flex on-mobile-flex-column">
                                <Field className="flex-item-fluid">
                                    <Autocomplete
                                        id="contactGroupEmail"
                                        options={contactsAutocompleteItems}
                                        limit={6}
                                        value={value}
                                        onChange={setValue}
                                        getData={(value) => value.label}
                                        type="search"
                                        placeholder={c('Placeholder').t`Start typing an email address`}
                                        onSelect={handleSelect}
                                        autoComplete="off"
                                    />
                                </Field>
                                <Button
                                    className="ml-0 md:ml-4 mt-2 md:mt-0"
                                    onClick={handleAddContact}
                                    disabled={!isValidEmail}
                                    data-testid="create-group:add-email"
                                >
                                    {c('Action').t`Add`}
                                </Button>
                            </div>
                            {!canAddMoreContacts && error && (
                                <Alert className="mb-4 mt-2" type="error">
                                    {c('Action').t`At most 100 contacts are allowed per contact group`}
                                </Alert>
                            )}
                        </div>
                    </div>
                ) : null}

                <ContactGroupTable contactEmails={model.contactEmails} onDelete={handleDeleteEmail} />

                {contactEmailsLength ? (
                    <div className="text-center color-weak">
                        {c('Info').ngettext(
                            msgid`${contactEmailsLength} Member`,
                            `${contactEmailsLength} Members`,
                            contactEmailsLength
                        )}
                    </div>
                ) : null}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose}>{c('Action').t`Close`}</Button>
                <Button color="norm" type="submit" disabled={loading} data-testid="create-group:save">
                    {c('Action').t`Save`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ContactGroupEditModal;
