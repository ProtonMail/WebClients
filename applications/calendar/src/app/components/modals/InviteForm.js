import React, { useState } from 'react';
import { isEmail } from 'proton-shared/lib/helpers/validators';
import {
    Row,
    Label,
    Field,
    Loader,
    Autocomplete,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    Button,
    SmallButton,
    useContactEmails
} from 'react-components';
import { c } from 'ttag';

const InviteForm = () => {
    const [contactEmails, loadingContactEmails] = useContactEmails();
    const headers = [c('Header').t`Name`, c('Header').t`Email`, c('Header').t`Action`];
    const [attendees, updateAttendees] = useState([]);
    const [newAttendee, updateAttendee] = useState('');

    const handleAdd = () => {
        updateAttendees([...attendees, newAttendee]);
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
            updateAttendees([...attendees, { name: '', email: newAttendee }]);
            updateAttendee('');
        }
    };

    const handleSelect = (contactEmailID) => {
        const { Name: name, Email: email } = contactEmails.find(({ ID }) => ID === contactEmailID);
        updateAttendees([...attendees, { name, email }]);
        updateAttendee('');
    };

    const handleRemove = (index) => () => {
        const copy = [...attendees];
        copy.splice(index, 1);
        updateAttendees(copy);
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
                        placeholder={c('Placeholder').t`Add an attendee`}
                        onSubmit={handleSubmit}
                        onSelect={handleSelect}
                        onInputValueChange={(value) => updateAttendee(value)}
                    />
                    {attendees.length ? null : <div className="mt1">{c('Info').t`No attendee yet`}</div>}
                </Field>
                <div>
                    <Button disabled={!newAttendee.length} onClick={handleAdd} className="ml1">{c('Action')
                        .t`Add`}</Button>
                </div>
            </Row>
            {attendees.length ? (
                <Table>
                    <TableHeader cells={headers} />
                    <TableBody>
                        {attendees.map(({ name, email }, index) => {
                            const key = `${index}`;
                            const cells = [
                                name,
                                email,
                                <SmallButton key={key} onClick={handleRemove(index)}>{c('Action')
                                    .t`Remove`}</SmallButton>
                            ];
                            return <TableRow key={key} cells={cells} />;
                        })}
                    </TableBody>
                </Table>
            ) : null}
        </>
    );
};

export default InviteForm;
