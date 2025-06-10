import type { CSSProperties, RefObject } from 'react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { c } from 'ttag';

import { Tooltip } from '@proton/atoms';
import { Icon } from '@proton/components';
import type { SimpleMap } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import type { OnMessageImageLoadError } from 'proton-mail/components/message/interface';

import { getAnchor } from '../../helpers/message/messageImages';
import type { MessageImage } from '../../store/messages/messagesTypes';

const sizeProps: ['width', 'height'] = ['width', 'height'];
/** Styles we should not clone on the anchor */
const forbiddenStyles = ['border', 'outline', 'background', 'padding'];

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
        // we only autorise display: inline-block
        if (
            (prop === 'display' && value !== 'inline-block') ||
            forbiddenStyles.some((forbidden) => prop.startsWith(forbidden))
        ) {
            return;
        }
        style[spineToCamelCase(prop)] = value;
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
    onMessageImageLoadError: OnMessageImageLoadError;
}

const MessageBodyImage = ({
    showRemoteImages,
    showEmbeddedImages,
    image,
    anchor,
    isPrint,
    iframeRef,
    onMessageImageLoadError,
}: Props) => {
    const imageRef = useRef<HTMLImageElement>(null);
    // Ref used to trigger an action after a onError while trying to load the image
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
        if (forbiddenStyles.some((forbidden) => prop.startsWith(forbidden))) {
            return;
        }
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

    if (showImage) {
        // attributes are provided by the code just above, coming from an original message source
        // eslint-disable-next-line jsx-a11y/alt-text
        return <img ref={imageRef} src={url} loading="lazy" onError={() => onMessageImageLoadError(image)} />;
    }

    const showLoader = status === 'loading';

    const errorMessage = error?.data?.Error ?? c('Message image').t`Image could not be loaded.`;

    const placeholderTooltip = error
        ? errorMessage
        : c('Message image').t`Image has not been loaded in order to protect your privacy.`;

    const icon = error ? 'file-slash' : 'file-image';

    const style = extractStyle(original, iframeRef.current?.contentWindow?.innerWidth);

    const placeholder = (
        <span
            style={style}
            className={clsx(['proton-image-placeholder', !!error && 'proton-image-placeholder--error'])}
        >
            {!showLoader ? <Icon name={icon} size={4} /> : null}

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
