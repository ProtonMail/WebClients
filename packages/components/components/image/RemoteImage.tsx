import { DetailedHTMLProps, ImgHTMLAttributes, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { toImage } from '@proton/shared/lib/helpers/image';
import { isURL } from '@proton/shared/lib/helpers/validators';
import { hasShowRemote } from '@proton/shared/lib/mail/images';

import { useLoading, useMailSettings } from '../../hooks';
import { Loader } from '../loader';

export interface Props extends DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> {
    src: string;
    text?: string;
}
const RemoteImage = ({ src, text = c('Action').t`Load image`, ...rest }: Props) => {
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const [loading, withLoading] = useLoading();
    const [showAnyways, setShowAnyways] = useState(false);
    const [image, setImage] = useState<HTMLImageElement>();

    useEffect(() => {
        const load = async () => {
            if (!isURL(src)) {
                return;
            }
            try {
                setImage(await toImage(src));
            } catch {
                // return;
            }
        };
        void withLoading<void>(load());
    }, [src]);

    const handleClick = () => setShowAnyways(true);

    if (loading || loadingMailSettings) {
        return <Loader />;
    }

    if (!image) {
        return <img alt={src} />;
    }

    if (hasShowRemote(mailSettings) || showAnyways) {
        // eslint-disable-next-line jsx-a11y/alt-text
        return <img src={image?.src} referrerPolicy="no-referrer" {...rest} />;
    }

    return <Button onClick={handleClick}>{text}</Button>;
};

export default RemoteImage;
