import { CSSProperties, RefObject, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { c } from 'ttag';

import { Icon, Tooltip, useApi } from '@proton/components';
import { SimpleMap } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { getAnchor } from '../../helpers/message/messageImages';
import { failedRemoteDirectLoading, loadRemoteProxy } from '../../logic/messages/images/messagesImagesActions';
import { MessageImage } from '../../logic/messages/messagesTypes';
import { useAppDispatch } from '../../logic/store';

const sizeProps: ['width', 'height'] = ['width', 'height'];

const spineToCamelCase = (value: string) => value.replaceAll(/-([a-z])/g, (_, letter) => letter.toUpperCase());

const forEachStyle = (style: CSSStyleDeclaration | undefined, iterator: (property: string, value: string) => void) => {
    if (!style) {
        return;
    }
    for (let i = 0; i < (style.length || 0); i++) {
        const prop = style.item(i);
        iterator(prop, style[prop as any]);
    }
};

const extractStyle = (original: HTMLElement | undefined, documentWidth: number | undefined): CSSProperties => {
    if (!original) {
        return {};
    }
    const style: CSSProperties = {};
    forEachStyle(original.style, (prop, value) => {
        if (
            prop !== 'display' &&
            !prop.startsWith('border') &&
            !prop.startsWith('outline') &&
            !prop.startsWith('background') &&
            !prop.startsWith('padding')
        ) {
            style[spineToCamelCase(prop)] = value;
        }
    });
    sizeProps.forEach((prop) => {
        const value = original?.getAttribute(prop)?.trim();
        if (value?.endsWith('%') || value === 'auto') {
            style[prop] = value;
        } else if (value) {
            if (documentWidth && Number(value.replace('px', '') || 0) > documentWidth) {
                style[prop] = '100%';
            } else {
                style[prop] = `${value}px`;
            }
        } else if (!style[prop]) {
            style[prop] = '30px';
        }
    });
    return style;
};

interface Props {
    showRemoteImages: boolean;
    showEmbeddedImages: boolean;
    image: MessageImage;
    anchor: HTMLElement;
    isPrint?: boolean;
    iframeRef: RefObject<HTMLIFrameElement>;
    localID: string;
    useProxy: boolean;
}

const MessageBodyImage = ({
    showRemoteImages,
    showEmbeddedImages,
    image,
    anchor,
    isPrint,
    iframeRef,
    localID,
    useProxy,
}: Props) => {
    const dispatch = useAppDispatch();
    const api = useApi();
    const imageRef = useRef<HTMLImageElement>(null);
    // Ref used to trigger an action after a onError while trying to load the image
    const hasLoadedAfterError = useRef({ hasLoadedProxy: false, hasLoadedDirect: false });
    const { type, error, url, status, original } = image;
    const showPlaceholder =
        error || status !== 'loaded' || (type === 'remote' ? !showRemoteImages : !showEmbeddedImages);
    const showImage = !showPlaceholder;

    const attributes =
        original?.getAttributeNames().reduce<SimpleMap<string>>((acc, name) => {
            acc[name] = original?.getAttribute(name) as string;
            return acc;
        }, {}) || {};

    forEachStyle(original?.style, (prop, value) => {
        anchor.style[prop as any] = value;
    });

    useEffect(() => {
        if (showImage) {
            Object.entries(attributes)
                .filter(([key]) => !key.endsWith('src'))
                .forEach(([key, value]) => {
                    imageRef.current?.setAttribute(key, value as string);
                });
        }
    }, [showImage]);

    const handleError = async () => {
        // If the image fails to load from the URL, we have no way to know why it has failed
        // But depending on the error, we want to handle it differently
        // In that case, we try to load the image "the old way", we will have more control on the error
        // Only make this call when user is using proxy.
        // - Without proxy we are already trying to load direct
        // - With EO, we are also already trying to load direct
        // However, if we are trying to load the image without the proxy, we don't want to trigger the load remote onError
        if (type === 'remote' && useProxy && !hasLoadedAfterError.current.hasLoadedProxy) {
            hasLoadedAfterError.current.hasLoadedProxy = true;
            await dispatch(loadRemoteProxy({ ID: localID, imageToLoad: image, api }));
        } else if (type === 'remote' && !hasLoadedAfterError.current.hasLoadedDirect) {
            // Instead, we want to add an error to the image in the state to display a placeholder
            hasLoadedAfterError.current.hasLoadedDirect = true;
            await dispatch(failedRemoteDirectLoading({ ID: localID, image }));
        }
    };

    if (showImage) {
        // attributes are the provided by the code just above, coming from original message source
        // eslint-disable-next-line jsx-a11y/alt-text
        return <img ref={imageRef} src={url} loading="lazy" onError={handleError} />;
    }

    const showLoader = status === 'loading';

    const errorMessage = error?.data?.Error
        ? error?.data?.Error
        : c('Message image')
              .t`Your browser could not verify the remote server's identity. The image might be hosted using the http protocol.`;

    const placeholderTooltip = error
        ? errorMessage
        : c('Message image').t`Image has not been loaded in order to protect your privacy.`;

    const icon = error ? 'cross-circle' : 'file-shapes';

    const style = extractStyle(original, iframeRef.current?.contentWindow?.innerWidth);

    const placeholder = (
        <span
            style={style}
            className={clsx(['proton-image-placeholder', !!error && 'proton-image-placeholder--error border-danger'])}
        >
            {!showLoader ? <Icon name={icon} size={20} /> : null}

            {showLoader ? (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className="proton-circle-loader">
                        <circle cx="100" cy="100" r="70" className="proton-circle-loader-track" />
                        <circle cx="100" cy="100" r="70" className="proton-circle-loader-circle" />
                    </svg>
                    <span className="proton-sr-only">{c('Info').t`Loading`}</span>
                </>
            ) : null}
        </span>
    );

    if (isPrint) {
        return placeholder;
    }

    return (
        <Tooltip title={placeholderTooltip} relativeReference={iframeRef}>
            {placeholder}
        </Tooltip>
    );
};

const MessageBodyImagePortal = ({ iframeRef, ...props }: Omit<Props, 'anchor'>) => {
    const iframeBody = iframeRef.current?.contentWindow?.document.body;
    const anchor = getAnchor(iframeBody, props.image);

    if (!anchor) {
        return null;
    }

    return createPortal(<MessageBodyImage {...props} anchor={anchor} iframeRef={iframeRef} />, anchor);
};

export default MessageBodyImagePortal;
