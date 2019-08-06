import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { randomIntFromInterval } from 'proton-shared/lib/helpers/function';
import { diff } from 'proton-shared/lib/helpers/array';
import { LABEL_COLORS } from 'proton-shared/lib/constants';
import { createContactGroup, updateLabel } from 'proton-shared/lib/api/labels';
import { labelContactEmails, unLabelContactEmails } from 'proton-shared/lib/api/contacts';
import {
    FormModal,
    useApi,
    Row,
    Label,
    Field,
    Input,
    Select,
    ColorSelector,
    SmallButton,
    PrimaryButton,
    TableHeader,
    TableBody,
    TableRow,
    Table,
    useContactGroups,
    useContactEmails,
    useNotifications,
    useEventManager
} from 'react-components';

const ContactGroupTable = ({ contactEmails, onDelete }) => {
    const header = [c('Table header').t`Name`, c('Table header').t`Address`, c('Table header').t`Action`];
    return (
        <Table className="noborder">
            <TableHeader cells={header} />
            <TableBody>
                {contactEmails.map(({ ID, Name, Email }) => {
                    const cells = [
                        <div className="ellipsis mw100" key={ID} title={Name}>
                            {Name}
                        </div>,
                        <div className="ellipsis mw100" key={ID} title={Email}>
                            {Email}
                        </div>,
                        <SmallButton key={ID} onClick={onDelete(ID)}>{c('Action').t`Delete`}</SmallButton>
                    ];
                    return <TableRow key={ID} cells={cells} />;
                })}
            </TableBody>
        </Table>
    );
};

ContactGroupTable.propTypes = {
    contactEmails: PropTypes.array,
    onDelete: PropTypes.func
};

const mapIDs = (contactEmails) => contactEmails.map(({ ID }) => ID);

const ContactGroupModal = ({ contactGroupID, ...rest }) => {
    const inputNameRef = useRef();
    const [loading, setLoading] = useState(false);
    const { call } = useEventManager();
    const api = useApi();
    const { createNotification } = useNotifications();
    const [contactGroups] = useContactGroups();
    const [contactEmails] = useContactEmails();

    const contactGroup = contactGroupID && contactGroups.find(({ ID }) => ID === contactGroupID);
    const existingContactEmails =
        contactGroupID && contactEmails.filter(({ LabelIDs = [] }) => LabelIDs.includes(contactGroupID));
    const title = contactGroupID ? c('Title').t`Edit contact group` : c('Title').t`Create new group`;

    const [model, setModel] = useState({
        name: contactGroupID ? contactGroup.Name : '',
        color: contactGroupID ? contactGroup.Color : LABEL_COLORS[randomIntFromInterval(0, LABEL_COLORS.length - 1)],
        contactEmails: contactGroupID ? existingContactEmails : []
    });
    const contactEmailIDs = model.contactEmails.map(({ ID }) => ID);
    const options = contactEmails
        .filter(({ ID }) => !contactEmailIDs.includes(ID))
        .map(({ ID, Email, Name }) => ({ label: `${Email} ${Name}`, value: ID }));

    const handleChangeName = ({ target }) => setModel({ ...model, name: target.value });
    const handleChangeColor = (color) => () => setModel({ ...model, color });
    const handleChangeEmail = ({ target }) => setModel({ ...model, contactEmailID: target.value });

    const handleAddEmail = () => {
        const contactEmail = contactEmails.find(({ ID }) => ID === model.contactEmailID);
        const alreadyExist = model.contactEmails.find(({ ID }) => ID === model.contactEmailID);

        if (contactEmail && !alreadyExist) {
            const copy = [...model.contactEmails];
            copy.push(contactEmail);
            setModel({ ...model, contactEmails: copy });
        }
    };

    const handleDeleteEmail = (contactEmailID) => () => {
        const index = model.contactEmails.findIndex(({ ID }) => ID === contactEmailID);

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
            const { Label = {} } = await api(
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
                    toUnlabel.length && api(unLabelContactEmails({ LabelID: ID, ContactEmailIDs: toUnlabel }))
                ].filter(Boolean)
            );
            await call();
            rest.onClose();
            createNotification({
                text: contactGroupID
                    ? c('Notification').t`Contact group updated`
                    : c('Notification').t`Contact group created`
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
                contactEmailID: options[0].value
            });
        }
    }, [model.contactEmails.length]);

    useEffect(() => {
        if (!contactGroupID) {
            inputNameRef.current.focus();
        }
    }, []);

    return (
        <FormModal onSubmit={handleSubmit} loading={loading} submit={c('Action').t`Save`} title={title} {...rest}>
            <Row>
                <Label htmlFor="contactGroupName">{c('Label for contact group name').t`Name`}</Label>
                <Field>
                    <Input
                        ref={inputNameRef}
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
                    <ColorSelector selected={model.color} onChange={handleChangeColor} />
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

ContactGroupModal.propTypes = {
    contactGroupID: PropTypes.string
};

export default ContactGroupModal;
