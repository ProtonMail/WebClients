import { useEffect, useRef, useState } from 'react';

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
    const initials = getInitials(name);
    const [load, setLoad] = useState(false);
    const url = useSenderImage(load ? email : '', bimiSelector);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const callback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach((entry) => {
                if (!load && entry.isIntersecting) {
                    setLoad(true);
                }
            });
        };
        const options = { rootMargin: '50px' };
        const observer = new IntersectionObserver(callback, options);

        if (ref?.current) {
            observer.observe(ref.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [ref?.current]);

    if (url) {
        return <img className={clsx(className, 'item-sender-image')} alt="" src={url} />;
    }

    return <span ref={ref}>{initials}</span>;
};

export default ContactImage;
