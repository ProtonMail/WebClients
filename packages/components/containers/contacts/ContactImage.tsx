import { useEffect, useState } from 'react';

import { useMailSettings } from '@proton/mail/mailSettings/hooks';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { HIDE_SENDER_IMAGES } from '@proton/shared/lib/mail/mailSettings';
import clsx from '@proton/utils/clsx';

import useSenderImage from './hooks/useSenderImage';

interface Props {
    email: string;
    name: string;
    className?: string;
    bimiSelector?: string;
    displaySenderImage?: boolean;
    variant?: 'default' | 'small';
}

const ContactImage = ({ email, name, className, bimiSelector, displaySenderImage, variant = 'default' }: Props) => {
    const [mailSettings] = useMailSettings();
    const canLoad = !!displaySenderImage && !!email && mailSettings?.HideSenderImages === HIDE_SENDER_IMAGES.SHOW;
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
                width={variant === 'default' ? '32' : '28'}
                src={url}
                onError={() => setTryToLoad(false)}
                loading="lazy" // Lazy load the image only when it's in the viewport
                data-testid="contact-image"
                style={{ inlineSize: variant === 'default' ? '2rem' : '1.75rem' }} // 32px, but following main font size
            />
        );
    }

    return <span data-testid="contact-initials">{getInitials(name)}</span>;
};

export default ContactImage;
