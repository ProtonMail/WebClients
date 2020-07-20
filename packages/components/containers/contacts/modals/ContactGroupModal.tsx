import React, { useState, useEffect, ChangeEvent } from 'react';
import { c } from 'ttag';

import { randomIntFromInterval, noop } from 'proton-shared/lib/helpers/function';
import { diff, orderBy } from 'proton-shared/lib/helpers/array';
import { LABEL_COLORS } from 'proton-shared/lib/constants';
import { createContactGroup, updateLabel } from 'proton-shared/lib/api/labels';
import { labelContactEmails, unLabelContactEmails } from 'proton-shared/lib/api/contacts';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts/Contact';

import ContactGroupTable from '../../../components/contacts/ContactGroupTable';
import useEventManager from '../../eventManager/useEventManager';
import useApi from '../../api/useApi';
import useNotifications from '../../notifications/useNotifications';
import { useContactGroups } from '../../../hooks/useCategories';
import Label from '../../../components/label/Label';
import useContactEmails from '../../../hooks/useContactEmails';
import Field from '../../../components/container/Field';
import ColorPicker from '../../../components/input/ColorPicker';
import Row from '../../../components/container/Row';
import Select from '../../../components/select/Select';
import Input from '../../../components/input/Input';
import FormModal from '../../../components/modal/FormModal';
import { PrimaryButton } from '../../../components/button';

const mapIDs = (contactEmails: ContactEmail[]) => contactEmails.map(({ ID }) => ID);

interface Props {
    contactGroupID?: string;
    onClose?: () => void;
}

const ContactGroupModal = ({ contactGroupID, onClose = noop, ...rest }: Props) => {
    const [loading, setLoading] = useState(false);
    const { call } = useEventManager();
    const api = useApi();
    const { createNotification } = useNotifications();
    const [contactGroups = []] = useContactGroups();
    const [contactEmails] = useContactEmails();

    const contactGroup = contactGroupID && contactGroups.find(({ ID }) => ID === contactGroupID);
    const existingContactEmails =
        contactGroupID &&
        contactEmails.filter(({ LabelIDs = [] }: { LabelIDs: string[] }) => LabelIDs.includes(contactGroupID));
    const title = contactGroupID ? c('Title').t`Edit contact group` : c('Title').t`Create new group`;

    const [model, setModel] = useState({
        name: contactGroupID && contactGroup ? contactGroup.Name : '',
        color:
            contactGroupID && contactGroup
                ? contactGroup.Color
                : LABEL_COLORS[randomIntFromInterval(0, LABEL_COLORS.length - 1)],
        contactEmails: contactGroupID ? existingContactEmails : [],
        contactEmailID: '',
    });
    const contactEmailIDs = model.contactEmails.map(({ ID }: ContactEmail) => ID);
    const options = orderBy(contactEmails as ContactEmail[], 'Email')
        .filter(({ ID }: ContactEmail) => !contactEmailIDs.includes(ID))
        .map(({ ID, Email, Name }: ContactEmail) => ({
            text: Email === Name ? `<${Email}>` : `${Name} <${Email}>`,
            value: ID,
        }));

    const handleChangeName = ({ target }: ChangeEvent<HTMLInputElement>) => setModel({ ...model, name: target.value });
    const handleChangeColor = (color: string) => setModel({ ...model, color });
    const handleChangeEmail = ({ target }: ChangeEvent<HTMLSelectElement>) =>
        setModel({ ...model, contactEmailID: target.value });

    const handleAddEmail = () => {
        const contactEmail = contactEmails.find(({ ID }: ContactEmail) => ID === model.contactEmailID);
        const alreadyExist = model.contactEmails.find(({ ID }: ContactEmail) => ID === model.contactEmailID);

        if (contactEmail && !alreadyExist) {
            const copy = [...model.contactEmails];
            copy.push(contactEmail);
            setModel({ ...model, contactEmails: copy });
        }
    };

    const handleDeleteEmail = (contactEmailID: string) => () => {
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
            const contactGroupParams = { Name: model.name, Color: model.color };
            const { Label } = await api(
                contactGroupID
                    ? updateLabel(contactGroupID, contactGroupParams)
                    : createContactGroup(contactGroupParams)
            );
            const { ID } = Label;
            const toLabel = mapIDs(model.contactEmails);
            const toUnlabel = contactGroupID ? diff(mapIDs(existingContactEmails), toLabel) : [];
            await Promise.all(
                [
                    toLabel.length && api(labelContactEmails({ LabelID: ID, ContactEmailIDs: toLabel })),
                    toUnlabel.length && api(unLabelContactEmails({ LabelID: ID, ContactEmailIDs: toUnlabel })),
                ].filter(Boolean)
            );
            await call();
            onClose();
            createNotification({
                text: contactGroupID
                    ? c('Notification').t`Contact group updated`
                    : c('Notification').t`Contact group created`,
            });
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    useEffect(() => {
        if (options.length) {
            setModel({
                ...model,
                contactEmailID: options[0].value,
            });
        }
    }, [model.contactEmails.length]);

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
                <Field>
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
                <Row>
                    <Label htmlFor="contactGroupEmail">{c('Label').t`Add email address`}</Label>
                    <Field>
                        <Select
                            id="contactGroupEmail"
                            value={model.contactEmailID}
                            options={options}
                            onChange={handleChangeEmail}
                        />
                        {model.contactEmails.length ? null : (
                            <div className="mt1">{c('Info').t`No contacts added yet`}</div>
                        )}
                    </Field>
                    <div className="ml1">
                        <PrimaryButton onClick={handleAddEmail}>{c('Action').t`Add`}</PrimaryButton>
                    </div>
                </Row>
            ) : null}
            {model.contactEmails.length ? (
                <ContactGroupTable contactEmails={model.contactEmails} onDelete={handleDeleteEmail} />
            ) : null}
        </FormModal>
    );
};

export default ContactGroupModal;
