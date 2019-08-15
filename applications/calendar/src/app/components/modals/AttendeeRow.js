import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { isEmail } from 'proton-shared/lib/helpers/validators';
import {
    Row,
    Label,
    Checkbox,
    Loader,
    Autocomplete,
    Icon,
    Button,
    useContactEmails,
    LinkButton
} from 'react-components';
import { c } from 'ttag';

const AttendeeRow = ({ model, updateModel }) => {
    const [contactEmails, loadingContactEmails] = useContactEmails();
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
                        <Button disabled={!newAttendee.length} onClick={handleAdd} className="ml1">{c('Action')
                            .t`Add`}</Button>
                    </div>
                    {model.attendees.length ? (
                        model.attendees.map(({ name, email, organizer }, index) => {
                            const key = `${index}`;
                            return (
                                <div className="flex flex-nowrap flex-item-fluid" key={key}>
                                    <div className="pl1 pr1 pt0-5 pb0-5 w100 bg-global-muted flex flex-nowrap mb0-5 mr1 rounded">
                                        <div className="mr1">
                                            <Icon name="alias" />
                                        </div>
                                        <div>
                                            <div>
                                                {name} ({email})
                                            </div>
                                            {organizer ? (
                                                <div>
                                                    <small>{c('Status').t`Organizer`}</small>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                    <LinkButton onClick={handleRemove(index)}>{c('Action').t`Delete`}</LinkButton>
                                </div>
                            );
                        })
                    ) : (
                        <div>{c('Info').t`No attendee yet`}</div>
                    )}
                    {model.attendees.length ? (
                        <>
                            <div className="mb0-5">
                                <Checkbox
                                    checked={model.send}
                                    onChange={({ target }) => updateModel({ ...model, send: target.checked })}
                                >{c('Label').t`Send invite/update to all guests`}</Checkbox>
                            </div>
                            <div className="mb0-5">
                                <Checkbox
                                    checked={model.invite}
                                    onChange={({ target }) => updateModel({ ...model, invite: target.checked })}
                                >{c('Label').t`Attendees can invite others`}</Checkbox>
                            </div>
                            <div className="mb0-5">
                                <Checkbox
                                    checked={model.modify}
                                    onChange={({ target }) => updateModel({ ...model, modify: target.checked })}
                                >{c('Label').t`Attendees can modify`}</Checkbox>
                            </div>
                            <div>
                                <Checkbox
                                    checked={model.see}
                                    onChange={({ target }) => updateModel({ ...model, see: target.checked })}
                                >{c('Label').t`Attendees can see attendees list`}</Checkbox>
                            </div>
                        </>
                    ) : null}
                </div>
            </Row>
        </>
    );
};

AttendeeRow.propTypes = {
    model: PropTypes.object,
    updateModel: PropTypes.func
};

export default AttendeeRow;
