import { Address } from '@proton/shared/lib/interfaces';
import { c } from 'ttag';
import { classnames } from '@proton/components';
import { EventModel } from '@proton/shared/lib/interfaces/calendar';

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
                        <div className="max-w50 text-ellipsis">{name}</div>
                        <div className="ml0-25 max-w50 text-ellipsis">{`<${email}>`}</div>
                    </>
                ) : (
                    <div className="max-w100 text-ellipsis">{email}</div>
                )}
                <span className="color-weak w100">{c('Label').t`Organizer`}</span>
            </div>
        </div>
    );
};

export default OrganizerRow;
