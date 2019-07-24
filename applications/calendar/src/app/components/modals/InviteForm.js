import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { isEmail } from 'proton-shared/lib/helpers/validators';
import {
    Row,
    Label,
    Checkbox,
    Field,
    Loader,
    Autocomplete,
    Icon,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    Button,
    SmallButton,
    useContactEmails
} from 'react-components';
import { c } from 'ttag';

const InviteForm = ({ model, updateModel }) => {
    const [contactEmails, loadingContactEmails] = useContactEmails();
    const headers = [c('Header').t`Name`, c('Header').t`Email`, c('Header').t`Status`, c('Header').t`Action`];
    const [newAttendee, updateAttendee] = useState('');

    const handleAdd = () => {
        updateModel({ ...model, attendees: [...model.attendees, newAttendee] });
    };

    if (loadingContactEmails) {
        return <Loader />;
    }

    const list = contactEmails.map(({ Email, Name, ID }) => ({
        label: [Name, Email].filter(Boolean).join(' '),
        value: ID
    }));

    const handleSubmit = () => {
        if (isEmail(newAttendee)) {
            updateModel({ ...model, attendees: [...model.attendees, { name: '', email: newAttendee }] });
            updateAttendee('');
        }
    };

    const handleSelect = (contactEmailID) => {
        const { Name: name, Email: email } = contactEmails.find(({ ID }) => ID === contactEmailID);
        updateModel({ ...model, attendees: [...model.attendees, { name, email }] });
        updateAttendee('');
    };

    const handleRemove = (index) => () => {
        const attendees = [...model.attendees];
        attendees.splice(index, 1);
        updateModel({ ...model, attendees });
    };

    return (
        <>
            <Row>
                <Label htmlFor="attendee-autocomplete">{c('Label').t`Attendees`}</Label>
                <Field>
                    <Autocomplete
                        id="attendee-autocomplete"
                        inputValue={newAttendee}
                        minChars={1}
                        list={list}
                        placeholder={c('Placeholder').t`Add attendees`}
                        onSubmit={handleSubmit}
                        onSelect={handleSelect}
                        onInputValueChange={(value) => updateAttendee(value)}
                    />
                    {model.attendees.length ? null : <div className="mt1">{c('Info').t`No attendee yet`}</div>}
                </Field>
                <div>
                    <Button disabled={!newAttendee.length} onClick={handleAdd} className="ml1">{c('Action')
                        .t`Add`}</Button>
                </div>
            </Row>
            {model.attendees.length ? (
                <>
                    <Table>
                        <TableHeader cells={headers} />
                        <TableBody>
                            {model.attendees.map(({ name, email }, index) => {
                                const key = `${index}`;
                                const cells = [
                                    name,
                                    email,
                                    <Icon key={key} name="on" />,
                                    <SmallButton key={key} onClick={handleRemove(index)}>{c('Action')
                                        .t`Remove`}</SmallButton>
                                ];
                                return <TableRow key={key} cells={cells} />;
                            })}
                        </TableBody>
                    </Table>
                    <div className="mb1">
                        <Checkbox
                            id="send"
                            checked={model.send}
                            onChange={({ target }) => updateModel({ ...model, send: target.checked })}
                        />
                        <label htmlFor="send">{c('Label').t`Send invite/update to all guests`}</label>
                    </div>
                </>
            ) : null}
        </>
    );
};

InviteForm.propTypes = {
    model: PropTypes.object,
    updateModel: PropTypes.func
};

export default InviteForm;
