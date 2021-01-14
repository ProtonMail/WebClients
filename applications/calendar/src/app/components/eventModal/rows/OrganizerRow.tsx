import { Address } from 'proton-shared/lib/interfaces';
import React from 'react';
import { c } from 'ttag';
import { classnames } from 'react-components';
import { EventModel } from '../../../interfaces/EventModel';

interface Props {
    model: EventModel;
    addresses: Address[];
}

const OrganizerRow = ({ model, addresses }: Props) => {
    const { addressID } = model.member;
    const organizerAddress = addresses.find(({ ID }) => ID === addressID);
    const { Email: email, DisplayName: name } = organizerAddress || {};
    const displayFull = name && name !== email;

    if (!organizerAddress) {
        return null;
    }

    return (
        <div key={email} className={classnames(['address-item flex mb0-25 pl0-5 pr0-5'])}>
            <div className="flex flex-item-fluid p0-5" title={displayFull ? `${name} <${email}>` : email}>
                {displayFull ? (
                    <>
                        <div className="mw50 ellipsis">{name}</div>
                        <div className="ml0-25 mw50 ellipsis">{`<${email}>`}</div>
                    </>
                ) : (
                    <div className="mw100 ellipsis">{email}</div>
                )}
                <span className="color-subheader w100">{c('Label').t`Organizer`}</span>
            </div>
        </div>
    );
};

export default OrganizerRow;
