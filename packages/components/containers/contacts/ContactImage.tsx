import { type CSSProperties, useEffect, useState } from 'react';

import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { HIDE_SENDER_IMAGES } from '@proton/shared/lib/mail/mailSettings';
import clsx from '@proton/utils/clsx';

import useSenderImage from './hooks/useSenderImage';

type Variant = 'default' | 'small' | 'large';

interface Props {
    email: string;
    name: string;
    className?: string;
    initialsClassName?: string;
    initialsStyle?: CSSProperties;
    bimiSelector?: string;
    displaySenderImage?: boolean;
    variant?: Variant;
    overrideSize?: number;
}

const getWidth = (variant: Variant) => {
    switch (variant) {
        case 'small':
            return '28';
        case 'large':
            return '36';
        case 'default':
            return '32';
    }
};

const getInlineSize = (variant: Variant) => {
    switch (variant) {
        case 'small':
            return '1.75rem';
        case 'large':
            return '2.25rem';
        case 'default':
            return '2rem';
    }
};

const ContactImage = ({
    email,
    name,
    className,
    initialsClassName: initialClassName,
    initialsStyle,
    bimiSelector,
    displaySenderImage,
    overrideSize,
    variant = 'default',
}: Props) => {
    const [mailSettings] = useMailSettings();
    const canLoad = !!displaySenderImage && !!email && mailSettings?.HideSenderImages === HIDE_SENDER_IMAGES.SHOW;
    const url = useSenderImage({ emailAddress: canLoad ? email : '', bimiSelector, overrideSize });
    const [tryToLoad, setTryToLoad] = useState(false);

    useEffect(() => {
        if (url) {
            setTryToLoad(true);
        }
    }, [url]);

    const width = getWidth(variant);
    const inlineSize = getInlineSize(variant);

    if (tryToLoad) {
        return (
            <img
                className={clsx(className, 'item-sender-image')}
                alt=""
                width={width}
                src={url}
                onError={() => setTryToLoad(false)}
                loading="lazy" // Lazy load the image only when it's in the viewport
                data-testid="contact-image"
                style={{ inlineSize }}
            />
        );
    }

    return (
        <span data-testid="contact-initials" className={initialClassName} style={initialsStyle}>
            {getInitials(name)}
        </span>
    );
};

export default ContactImage;
