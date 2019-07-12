import React, { useState } from 'react';
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

    const list = contactEmails.map(({ Email }) => Email);
    const handleSubmit = () => {};

    const handleSelect = (newAttendee) => {
        updateAttendees([...attendees, newAttendee]);
        updateAttendee('');
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
                    <Button onClick={handleAdd} className="ml1">{c('Action').t`Add`}</Button>
                </div>
            </Row>
            {attendees.length ? (
                <Table>
                    <TableHeader cells={headers} />
                    <TableBody>
                        {attendees.map(({ ID }) => {
                            const cells = [];
                            return <TableRow key={ID} cells={cells} />;
                        })}
                    </TableBody>
                </Table>
            ) : null}
        </>
    );
};

export default InviteForm;
