import { useEffect, useState } from 'react';

import { useMailSettings } from '@proton/components/hooks';
import { getInitials } from '@proton/shared/lib/helpers/string';
import clsx from '@proton/utils/clsx';

import useSenderImage from './hooks/useSenderImage';

interface Props {
    email: string;
    name: string;
    className?: string;
    bimiSelector?: string;
    displaySenderImage?: boolean;
}

const ContactImage = ({ email, name, className, bimiSelector, displaySenderImage }: Props) => {
    const [mailSettings] = useMailSettings();
    const canLoad = !!displaySenderImage && !!email && mailSettings?.HideSenderImages === 0;
    const url = useSenderImage(canLoad ? email : '', bimiSelector);
    const [tryToLoad, setTryToLoad] = useState(false);

    useEffect(() => {
        if (url) {
            setTryToLoad(true);
        }
    }, [url]);

    if (tryToLoad) {
        return (
            <img
                className={clsx(className, 'item-sender-image')}
                alt=""
                width="32"
                src={url}
                onError={() => setTryToLoad(false)}
                loading="lazy" // Lazy load the image only when it's in the viewport
                data-testid="contact-image"
                style={{ inlineSize: '2rem' }} // 32px, but following main font size
            />
        );
    }

    return <span data-testid="contact-initials">{getInitials(name)}</span>;
};

export default ContactImage;
