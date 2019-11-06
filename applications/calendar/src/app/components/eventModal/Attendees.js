import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { isEmail } from 'proton-shared/lib/helpers/validators';
import { Row, Label, Loader, Autocomplete, Button, useContactEmails } from 'react-components';
import { c } from 'ttag';
import Attendee, { Organizer } from './Attendee';
import { updateItem } from './eventForm/state';

const Attendees = ({ organizer, attendees = [], onChange }) => {
    const [contactEmails, loadingContactEmails] = useContactEmails();
    const [newAttendee, updateAttendee] = useState('');
    const latestAttendees = useRef(attendees);

    if (loadingContactEmails) {
        return <Loader />;
    }

    const list = contactEmails.map(({ Email, Name, ID }) => ({
        label: [Name, Email].filter(Boolean).join(' '),
        value: ID
    }));

    const handleAddAttendee = ({ email, ...rest }) => {
        const attendees = latestAttendees.current;
        if (attendees.find(({ email: otherEmail }) => email === otherEmail) || email === organizer.email) {
            return;
        }
        onChange(attendees.concat({ email, permissions: 0, rsvp: false, ...rest }));
    };

    const handleSubmit = () => {
        if (isEmail(newAttendee)) {
            handleAddAttendee({ name: '', email: newAttendee });
        }
        updateAttendee('');
    };

    // Workaround for the autocomplete component that caches the callback
    latestAttendees.current = attendees;

    const handleSelect = (contactEmailID) => {
        const { Name: name, Email: email } = contactEmails.find(({ ID }) => ID === contactEmailID) || {};
        if (!email) {
            return;
        }
        handleAddAttendee({ name, email });
        updateAttendee('');
    };

    return (
        <>
            <Row>
                <Label htmlFor="attendee-autocomplete">{c('Label').t`Attendees`}</Label>
                <div className="flex-item-fluid">
                    <div className="flex flex-nowrap mb1">
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
                        <Button disabled={!newAttendee.length} onClick={handleSubmit} className="ml1">
                            {c('Action').t`Add`}
                        </Button>
                    </div>
                    {attendees.length ? (
                        <>
                            <Organizer name={organizer.name} email={organizer.email} />
                            {attendees.map((attendee, index) => {
                                const { name, email, permissions, rsvp, isExpanded = true } = attendee;
                                return (
                                    <Attendee
                                        key={email}
                                        name={name}
                                        email={email}
                                        permissions={permissions}
                                        rsvp={rsvp}
                                        isExpanded={isExpanded}
                                        onChangeRsvp={(value) => {
                                            onChange(updateItem(attendees, index, { ...attendee, rsvp: value }));
                                        }}
                                        onChangePermissions={(value) => {
                                            onChange(updateItem(attendees, index, { ...attendee, permissions: value }));
                                        }}
                                    />
                                );
                            })}
                        </>
                    ) : (
                        <div>{c('Info').t`No attendee yet`}</div>
                    )}
                </div>
            </Row>
        </>
    );
};

Attendees.propTypes = {
    attendees: PropTypes.array,
    organizer: PropTypes.object,
    onChange: PropTypes.func
};

export default Attendees;
