import { useEffect, useState } from 'react';

import { useAuthentication, useConfig, useMailSettings } from '@proton/components/hooks';
import { useLoading } from '@proton/hooks';
import { CONTACT_IMG_SIZE } from '@proton/shared/lib/contacts/constants';
import { getContactImageSource } from '@proton/shared/lib/helpers/contacts';
import { resizeImage, toImage } from '@proton/shared/lib/helpers/image';
import { isBase64Image } from '@proton/shared/lib/helpers/validators';
import { hasShowEmbedded, hasShowRemote } from '@proton/shared/lib/mail/images';
import noop from '@proton/utils/noop';

type ImageModel = {
    src: string;
    width?: number;
    height?: number;
    isSmall?: boolean;
};

interface Props {
    photo: string;
    needsResize?: boolean;
    onToggleLoadDirectBanner?: (show: boolean) => void;
}

const useLoadContactImage = ({ photo, onToggleLoadDirectBanner, needsResize = false }: Props) => {
    const authentication = useAuthentication();
    const { API_URL } = useConfig();
    const [mailSettings, loadingMailSettings] = useMailSettings();

    const [image, setImage] = useState<ImageModel>({ src: '' });
    const [loadingResize, withLoadingResize] = useLoading(true);
    const [needsLoadDirect, setNeedsLoadDirect] = useState(false);
    const [showAnyway, setShowAnyway] = useState(false);
    const [loadDirectFailed, setLoadDirectFailed] = useState(false);

    const loading = loadingMailSettings || loadingResize;
    const hasShowRemoteImages = hasShowRemote(mailSettings);
    const hasShowEmbeddedImages = hasShowEmbedded(mailSettings);

    const isBase64 = isBase64Image(photo);

    // Show image when :
    // - User requested by clicking on the load button
    // - Both Auto show settings are ON
    // - If image is embedded, check embedded setting
    // - If image is remote, check remote setting
    const shouldShow =
        showAnyway ||
        (hasShowEmbeddedImages && hasShowRemoteImages) ||
        (isBase64 ? hasShowRemoteImages : hasShowRemoteImages);

    /**
     * How image loading works:
     * 1. If shouldShow = false (e.g. Auto show setting is OFF)
     *      => Nothing is done, we should display a "Load" button on the component calling this hook
     * 2. Load is possible (Auto show ON or user clicked on load)
     *      a. User is using the proxy OR the image is b64
     *          => We pass in loadImage function. We will try to load the image using the Proton image proxy
     *      b. User is not using the proxy
     *          => We pass in loadImageDirect. We will try to load the image using the default URL
     * 3. Loading failed
     *      a. Loading with proxy failed
     *         A banner should be displayed to the user (from the component calling this hook)
     *         informing that the image could not be loaded using Proton image proxy.
     *         The user has the possibility to load the image with its default url
     *            => We pass in loadImageDirect
     *      b. Loading without proxy failed
     *            => A placeholder should be displayed in the component calling this hook to inform
     *               the user that the image could not be loaded (+ potential load direct banner is removed)
     */

    const handleResizeImage = async (src: string, width: number, height: number, useProxy: boolean) => {
        if (width <= CONTACT_IMG_SIZE && height <= CONTACT_IMG_SIZE) {
            setImage({ src, width, height, isSmall: true });
        } else {
            const resized = await resizeImage({
                original: src,
                maxWidth: CONTACT_IMG_SIZE,
                maxHeight: CONTACT_IMG_SIZE,
                bigResize: true,
                crossOrigin: useProxy,
            });

            setImage({ src: resized });
        }
    };
    const loadImage = async () => {
        try {
            const uid = authentication.getUID();
            const imageURL = getContactImageSource({
                apiUrl: API_URL,
                url: photo,
                uid,
                useProxy: !!mailSettings?.ImageProxy,
                origin: window.location.origin,
            });

            const { src, width, height } = await toImage(imageURL);

            if (needsResize) {
                await handleResizeImage(src, width, height, !!mailSettings?.ImageProxy);
            } else {
                setImage({ src });
            }
        } catch (e) {
            if (!!mailSettings?.ImageProxy) {
                onToggleLoadDirectBanner?.(true);
                setNeedsLoadDirect(true);
            }
            throw new Error('Get image failed');
        }
    };

    const loadImageDirect = async () => {
        try {
            const { src, width, height } = await toImage(photo, false);

            if (needsResize) {
                // In some cases resizing the image will not work (e.g. images using .ppm formats)
                // So the loading from handleResizeImage will fail.
                // In this case, we catch the error and set the Image using the image src
                // At this point if the image necessarily loaded,
                // otherwise we would have passed in the function catch block where we set loadDirectFailed
                try {
                    await handleResizeImage(src, width, height, false);
                } catch (e) {
                    setImage({ src });
                }
            } else {
                setImage({ src });
            }

            setNeedsLoadDirect(false);
            onToggleLoadDirectBanner?.(false);
        } catch (e) {
            setLoadDirectFailed(true);
            onToggleLoadDirectBanner?.(false);
            throw new Error('Get image failed');
        }
    };

    const handleLoadImageDirect = async () => {
        void withLoadingResize(loadImageDirect());
    };

    useEffect(() => {
        if (!photo || !shouldShow) {
            return;
        }

        if (mailSettings?.ImageProxy || isBase64) {
            // if resize fails (e.g. toImage will throw if the requested resource hasn't specified a CORS policy),
            // fallback to the original src
            void withLoadingResize(loadImage().catch(noop));
        } else {
            void withLoadingResize(loadImageDirect().catch(noop));
        }
    }, [photo, shouldShow]);

    const display: 'loading' | 'loadDirectFailed' | 'needsLoadDirect' | 'smallImageLoaded' | 'loaded' | 'askLoading' =
        (() => {
            if (shouldShow) {
                if (loading) {
                    return 'loading';
                }

                if (loadDirectFailed) {
                    return 'loadDirectFailed';
                }

                if (needsLoadDirect) {
                    return 'needsLoadDirect';
                }

                return 'loaded';
            }

            return 'askLoading';
        })();

    return {
        loadImage,
        loadImageDirect,
        handleLoadImageDirect,
        image,
        needsLoadDirect,
        setShowAnyway,
        loading,
        shouldShow,
        loadDirectFailed,
        display,
    };
};

export default useLoadContactImage;
