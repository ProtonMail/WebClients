import React, { useState, ChangeEvent, useMemo } from 'react';
import { c, msgid } from 'ttag';
import { randomIntFromInterval, noop } from '@proton/shared/lib/helpers/function';
import { diff, orderBy } from '@proton/shared/lib/helpers/array';
import { LABEL_COLORS } from '@proton/shared/lib/constants';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts/Contact';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import {
    FormModal,
    Input,
    Row,
    Field,
    Label,
    ColorPicker,
    ContactGroupTable,
    Autocomplete,
    Button,
} from '../../../components';
import { useContactEmails, useContactGroups } from '../../../hooks';
import useUpdateGroup from '../useUpdateGroup';

interface Props {
    contactGroupID?: string;
    selectedContactEmails?: ContactEmail[];
    onClose?: () => void;
    onDelayedSave?: (groupID: string) => void;
}

const ContactGroupModal = ({
    contactGroupID,
    onClose = noop,
    selectedContactEmails = [],
    onDelayedSave,
    ...rest
}: Props) => {
    const [loading, setLoading] = useState(false);
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
        color:
            contactGroupID && contactGroup
                ? contactGroup.Color
                : LABEL_COLORS[randomIntFromInterval(0, LABEL_COLORS.length - 1)],
        contactEmails: contactGroupID ? existingContactEmails : selectedContactEmails,
    });
    const contactEmailIDs = model.contactEmails.map(({ ID }: ContactEmail) => ID);

    const options = orderBy(contactEmails as ContactEmail[], 'Email').filter(
        ({ ID }: ContactEmail) => !contactEmailIDs.includes(ID)
    );

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

    const handleSelect = (newContactEmail: ContactEmail | string) => {
        if (typeof newContactEmail === 'string') {
            handleAdd();
        } else {
            setModel((model) => ({
                ...model,
                contactEmails: [...model.contactEmails, newContactEmail],
            }));
            setValue('');
        }
    };

    const handleDeleteEmail = (contactEmailID: string) => {
        const index = model.contactEmails.findIndex(({ ID }: ContactEmail) => ID === contactEmailID);

        if (index > -1) {
            const copy = [...model.contactEmails];
            copy.splice(index, 1);
            setModel({ ...model, contactEmails: copy });
        }
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);

            // If delayed save, do not save the contact in the new group because the contact does not really exists yet
            const toAdd = !onDelayedSave ? model.contactEmails.filter(({ ID }) => isTruthy(ID)) : [];
            const toCreate = !onDelayedSave ? model.contactEmails.filter(({ ID }) => !isTruthy(ID)) : [];
            const toRemove = !onDelayedSave ? (contactGroupID ? diff(existingContactEmails, toAdd) : []) : [];

            await updateGroup({
                groupID: contactGroupID,
                name: model.name,
                color: model.color,
                toAdd,
                toRemove,
                toCreate,
                onDelayedSave,
            });

            onClose();
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const contactEmailsLength = model.contactEmails.length;

    return (
        <FormModal
            onSubmit={handleSubmit}
            loading={loading}
            submit={c('Action').t`Save`}
            title={title}
            onClose={onClose}
            {...rest}
        >
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
                <Field>
                    <ColorPicker color={model.color} onChange={handleChangeColor} />
                </Field>
            </Row>
            {options.length ? (
                <div className="flex flex-nowrap mb1 on-mobile-flex-column">
                    <Label htmlFor="contactGroupEmail">{c('Label').t`Add email address`}</Label>
                    <Field className="flex-item-fluid">
                        <Autocomplete
                            id="contactGroupEmail"
                            options={options}
                            limit={6}
                            value={value}
                            onChange={setValue}
                            getData={({ Email, Name }) => (Email === Name ? `<${Email}>` : `${Name} <${Email}>`)}
                            type="search"
                            placeholder={c('Placeholder').t`Start typing an email address`}
                            onSelect={handleSelect}
                            autoComplete="off"
                        />
                    </Field>
                    <Button className="ml1 on-mobile-ml0 on-mobile-mt0-5" onClick={handleAdd} disabled={!isValidEmail}>
                        {c('Action').t`Add`}
                    </Button>
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
        </FormModal>
    );
};

export default ContactGroupModal;
