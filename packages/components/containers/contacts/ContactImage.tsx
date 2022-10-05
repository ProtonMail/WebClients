import { useState } from 'react';

import { getInitials } from '@proton/shared/lib/helpers/string';
import clsx from '@proton/utils/clsx';

import useSenderImage from './hooks/useSenderImage';

interface Props {
    email: string;
    name: string;
    className?: string;
}

const ContactImage = ({ email, name, className }: Props) => {
    const initials = getInitials(name);
    const [load, setLoad] = useState(false);
    const url = useSenderImage(load ? email : '');
    const handleError = () => setLoad(true);

    if (load && !url) {
        return <>{initials}</>;
    }

    return (
        <img
            className={clsx(className, 'item-sender-image')}
            alt={name}
            onError={handleError}
            loading="lazy"
            src={url}
        />
    );
};

export default ContactImage;
