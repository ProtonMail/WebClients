import { c } from 'ttag';

import { OrganizerModel } from '@proton/shared/lib/interfaces/calendar';

interface Props {
    organizer: OrganizerModel;
}

const getDisplayNames = (name: string, email: string) => {
    const displayFull = name && name !== email;

    const nameEmail = displayFull ? `${name} <${email}>` : email;

    return {
        nameEmail,
        displayFull,
    };
};

const OrganizerRow = ({ organizer }: Props) => {
    const { email, cn: name } = organizer;
    const { nameEmail, displayFull } = getDisplayNames(name, email);

    const nameEmailDisplay = displayFull ? (
        <>
            <span className="text-semibold text-sm">{name}</span>
            <span className="color-weak ml-1 text-sm">{email}</span>
        </>
    ) : (
        <span className="text-semibold text-sm">{email}</span>
    );

    return (
        <div key={email} className="flex items-start mb-1">
            <div className="text-ellipsis max-w-full" title={nameEmail}>
                {nameEmailDisplay}
            </div>
            <div className="color-weak w-full text-sm">{c('Label').t`Organizer`}</div>
        </div>
    );
};

export default OrganizerRow;
