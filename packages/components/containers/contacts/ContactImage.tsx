import { useState } from 'react';

import { getInitials } from '@proton/shared/lib/helpers/string';
import clsx from '@proton/utils/clsx';

import useSenderImage from './hooks/useSenderImage';

interface Props {
    email: string;
    name: string;
    className?: string;
}

const BASE_64_IMAGE =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBgDTD2qgAAAAASUVORK5CYII=';

const ContactImage = ({ email, name, className }: Props) => {
    const initials = getInitials(name);
    const [load, setLoad] = useState(false);
    const url = useSenderImage(load ? email : '');
    const src = url || BASE_64_IMAGE;
    const handleLoad = () => setLoad(true);

    if (load && !url) {
        return <>{initials}</>;
    }

    return <img className={clsx(className, 'item-sender-image')} alt="" onLoad={handleLoad} loading="lazy" src={src} />;
};

export default ContactImage;
