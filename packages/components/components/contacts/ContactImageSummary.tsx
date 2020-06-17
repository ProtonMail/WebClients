import React, { useState, useEffect } from 'react';
import { c } from 'ttag';

import { getInitial } from 'proton-shared/lib/helpers/string';
import { isURL } from 'proton-shared/lib/helpers/validators';
import { resizeImage, toImage } from 'proton-shared/lib/helpers/image';
import { noop } from 'proton-shared/lib/helpers/function';
import { SHOW_IMAGES } from 'proton-shared/lib/constants';
import { CONTACT_IMG_SIZE } from 'proton-shared/lib/contacts/constants';

import useLoading from '../../hooks/useLoading';
import useMailSettings from '../../hooks/useMailSettings';
import Loader from '../loader/Loader';
import { Button } from '../button';

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
    const [showAnyway, setShowAnyway] = useState(!isURL(photo));
    const [image, setImage] = useState<ImageModel>({ src: photo });
    const [{ ShowImages }, loadingMailSettings] = useMailSettings();
    const [loadingResize, withLoadingResize] = useLoading(true);
    const loading = loadingMailSettings || loadingResize;
    const showPhoto = ShowImages & SHOW_IMAGES.REMOTE || showAnyway;

    useEffect(() => {
        if (!photo || !showPhoto) {
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
                bigResize: true
            });
            setImage({ src: resized });
        };
        // if resize fails (e.g. toImage will throw if the requested resource hasn't specified a CORS policy),
        // fallback to the original src
        withLoadingResize(resize().catch(noop));
    }, [photo, showPhoto]);

    if (!photo) {
        return (
            <div className="bordered bg-white-dm ratio-container-square mb0">
                <span className="inner-ratio-container flex">
                    <span className="mauto color-global-border h1">{getInitial(name)}</span>
                </span>
            </div>
        );
    }

    const handleClick = () => setShowAnyway(true);

    if (showPhoto) {
        if (loading) {
            return <Loader />;
        }

        const style = {
            backgroundImage: `url(${image.src})`,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover'
        };

        if (!image.isSmall) {
            // fit the image in the rounded container as background image
            return (
                <div className="ratio-container-square" style={style}>
                    <span className="inner-ratio-container" />
                </div>
            );
        }

        // For a small image, we have to create a smaller rounded container inside the bigger standard one,
        // and fit the image as background inside it. As container width we must pick the smallest dimension
        return (
            <div className="ratio-container-square mb0">
                <span className="inner-ratio-container flex">
                    <div
                        className="mbauto mtauto center"
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
        <div className="bordered bg-white-dm ratio-container-square mb0">
            <span className="inner-ratio-container flex">
                <span className="mauto color-global-border">
                    <Button onClick={handleClick}>{c('Action').t`Load photo`}</Button>
                </span>
            </span>
        </div>
    );
};

export default ContactImageSummary;
