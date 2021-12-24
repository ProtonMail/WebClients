import { DetailedHTMLProps, ImgHTMLAttributes, useEffect, useState } from 'react';
import { c } from 'ttag';
import { SHOW_IMAGES } from '@proton/shared/lib/constants';
import { isURL } from '@proton/shared/lib/helpers/validators';
import { toImage } from '@proton/shared/lib/helpers/image';
import Button from '../button/Button';
import { useMailSettings, useLoading } from '../../hooks';
import { Loader } from '../loader';

export interface Props extends DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> {
    src: string;
    text?: string;
}
const RemoteImage = ({ src, text = c('Action').t`Load image`, ...rest }: Props) => {
    const [{ ShowImages } = { ShowImages: SHOW_IMAGES.NONE }, loadingMailSettings] = useMailSettings();
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

    if (ShowImages & SHOW_IMAGES.REMOTE || showAnyways) {
        return <img src={image?.src} referrerPolicy="no-referrer" {...rest} />;
    }

    return <Button onClick={handleClick}>{text}</Button>;
};

export default RemoteImage;
