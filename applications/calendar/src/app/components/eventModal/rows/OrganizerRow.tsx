import { c } from 'ttag';

import { OrganizerModel } from '@proton/shared/lib/interfaces/calendar';
import clsx from '@proton/utils/clsx';

interface Props {
    organizer: OrganizerModel;
}

const OrganizerRow = ({ organizer }: Props) => {
    const { email, cn: name } = organizer;
    const displayFull = name && name !== email;

    return (
        <div key={email} className={clsx(['address-item flex mb-1 pl0-5 pr0-5'])}>
            <div className="flex flex-item-fluid p0-5" title={displayFull ? `${name} <${email}>` : email}>
                {displayFull ? (
                    <div className="text-ellipsis">{`${name} <${email}>`}</div>
                ) : (
                    <div className="max-w100 text-ellipsis">{email}</div>
                )}
                <span className="color-weak w100">{c('Label').t`Organizer`}</span>
            </div>
        </div>
    );
};

export default OrganizerRow;
