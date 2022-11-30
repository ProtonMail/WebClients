import { useState } from 'react';

import 'intersection-observer';

import { getInitials } from '@proton/shared/lib/helpers/string';
import clsx from '@proton/utils/clsx';

import useSenderImage from './hooks/useSenderImage';

interface Props {
    email: string;
    name: string;
    className?: string;
    bimiSelector?: string;
}

const ContactImage = ({ email, name, className, bimiSelector }: Props) => {
    const [fallback, setFallback] = useState(false);
    const { canLoad, url } = useSenderImage(email, fallback, bimiSelector);

    if (canLoad) {
        // Fallback to XHR API call to load the image if native fails
        const handleError = () => {
            // url is not set at the initial render
            if (!url) {
                return;
            }
            setFallback(true);
        };

        return (
            <img
                className={clsx(className, 'item-sender-image')}
                alt=""
                width="32"
                src={url}
                onError={handleError}
                loading="lazy" // Lazy load the image only when it's in the viewport
            />
        );
    }

    return <span>{getInitials(name)}</span>;
};

export default ContactImage;
