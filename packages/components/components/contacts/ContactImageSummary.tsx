import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { resizeImage, toImage } from '@proton/shared/lib/helpers/image';
import { isBase64Image } from '@proton/shared/lib/helpers/validators';
import { noop } from '@proton/shared/lib/helpers/function';
import { SHOW_IMAGES } from '@proton/shared/lib/constants';
import { CONTACT_IMG_SIZE } from '@proton/shared/lib/contacts/constants';
import { useLoading, useMailSettings } from '../../hooks';
import Loader from '../loader/Loader';
import { Icon } from '../icon';

interface Props {
    photo: string;
    name: string;
}

type ImageModel = {
    src: string;
    width?: number;
    height?: number;
    isSmall?: boolean;
};

const ContactImageSummary = ({ photo, name }: Props) => {
    const isBase64 = isBase64Image(photo);
    const [showAnyway, setShowAnyway] = useState(false);
    const [image, setImage] = useState<ImageModel>({ src: photo });
    const [{ ShowImages } = { ShowImages: SHOW_IMAGES.NONE }, loadingMailSettings] = useMailSettings();
    const [loadingResize, withLoadingResize] = useLoading(true);
    const loading = loadingMailSettings || loadingResize;
    const shouldShow =
        showAnyway || ShowImages === SHOW_IMAGES.ALL || (isBase64 ? true : ShowImages === SHOW_IMAGES.REMOTE);

    useEffect(() => {
        if (!photo || !shouldShow) {
            return;
        }
        const resize = async () => {
            const { src, width, height } = await toImage(photo);

            if (width <= CONTACT_IMG_SIZE && height <= CONTACT_IMG_SIZE) {
                setImage({ src, width, height, isSmall: true });
                return;
            }
            const resized = await resizeImage({
                original: photo,
                maxWidth: CONTACT_IMG_SIZE,
                maxHeight: CONTACT_IMG_SIZE,
                bigResize: true,
            });
            setImage({ src: resized });
        };
        // if resize fails (e.g. toImage will throw if the requested resource hasn't specified a CORS policy),
        // fallback to the original src
        void withLoadingResize(resize().catch(noop));
    }, [photo, shouldShow, showAnyway]);

    if (!photo) {
        return (
            <div className="bordered bg-norm rounded ratio-container-square mb0">
                <span className="inner-ratio-container flex">
                    <span className="mauto color-weak h1">{getInitials(name)}</span>
                </span>
            </div>
        );
    }

    const handleClick = () => setShowAnyway(true);

    if (shouldShow) {
        if (loading) {
            return (
                <div className="ratio-container-square rounded bordered">
                    <span className="inner-ratio-container flex">
                        <Loader />
                    </span>
                </div>
            );
        }

        const style = {
            backgroundImage: `url(${image.src})`,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
        };

        if (!image.isSmall) {
            // fit the image in the rounded container as background image
            return (
                <div className="ratio-container-square rounded bordered" style={style}>
                    <span className="inner-ratio-container" />
                </div>
            );
        }

        // For a small image, we have to create a smaller rounded container inside the bigger standard one,
        // and fit the image as background inside it. As container width we must pick the smallest dimension
        return (
            <div className="ratio-container-square mb0 rounded bordered">
                <span className="inner-ratio-container flex">
                    <div
                        className="mbauto mtauto flex center"
                        style={{ width: `${Math.min(image.width || 0, image.height || 0)}px` }}
                    >
                        <div className="ratio-container-square" style={style}>
                            <span className="inner-ratio-container" />
                        </div>
                    </div>
                </span>
            </div>
        );
    }

    return (
        <button type="button" className="bordered rounded bg-norm ratio-container-square mb0" onClick={handleClick}>
            <span className="inner-ratio-container flex">
                <span className="mauto lh-rg flex flex-column flex-align-items-center">
                    <Icon name="remote-content" />
                    <div className="m0-5 color-primary">{c('Action').t`Load image`}</div>
                </span>
            </span>
        </button>
    );
};

export default ContactImageSummary;
