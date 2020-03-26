import React from 'react';
import { c } from 'ttag';
import { hasBit } from 'proton-shared/lib/helpers/bitset';
import {
    PERMISSIONS_DELETE,
    PERMISSIONS_EDIT,
    PERMISSIONS_INVITE,
    PERMISSIONS_SEE_ATTENDEES
} from 'proton-shared/lib/calendar/attendees';
import { Checkbox, Icon } from 'react-components';

export const Item = ({ name, email, children }) => {
    return (
        <div className="pl1 pr1 pt0-5 pb0-5 w100 bg-global-muted mb0-5 mr1 rounded" key={email}>
            <div className="flex flex-nowrap">
                <div className="mr1">
                    <Icon name="alias" />
                </div>
                <div>
                    {name} ({email})
                </div>
            </div>
            {children}
        </div>
    );
};

export const Organizer = ({ name, email }) => {
    return <Item name={name} email={email} />;
};

const Attendee = ({ name, email, permissions, rsvp, isExpanded, onChangeRsvp, onChangePermissions }) => {
    const update = (permission, isChecked) => permissions + (isChecked ? 1 : -1) * permission;

    const extra = isExpanded ? (
        <>
            <div className="mb0-5">
                <Checkbox checked={rsvp} onChange={({ target }) => onChangeRsvp(target.checked)}>{c('Label')
                    .t`Send invite/updates`}</Checkbox>
            </div>
            <div className="mb0-5">
                <Checkbox
                    checked={hasBit(permissions, PERMISSIONS_DELETE)}
                    onChange={({ target }) => onChangePermissions(update(PERMISSIONS_DELETE, target.checked))}
                >{c('Label').t`Attendee can delete others`}</Checkbox>
            </div>
            <div className="mb0-5">
                <Checkbox
                    checked={hasBit(permissions, PERMISSIONS_INVITE)}
                    onChange={({ target }) => onChangePermissions(update(PERMISSIONS_INVITE, target.checked))}
                >{c('Label').t`Attendee can invite others`}</Checkbox>
            </div>
            <div className="mb0-5">
                <Checkbox
                    checked={hasBit(permissions, PERMISSIONS_EDIT)}
                    onChange={({ target }) => onChangePermissions(update(PERMISSIONS_EDIT, target.checked))}
                >{c('Label').t`Attendee can modify`}</Checkbox>
            </div>
            <div>
                <Checkbox
                    checked={hasBit(permissions, PERMISSIONS_SEE_ATTENDEES)}
                    onChange={({ target }) => onChangePermissions(update(PERMISSIONS_SEE_ATTENDEES, target.checked))}
                >{c('Label').t`Attendee can see attendees list`}</Checkbox>
            </div>
        </>
    ) : null;

    return (
        <Item name={name} email={email}>
            {extra}
        </Item>
    );
};

export default Attendee;
