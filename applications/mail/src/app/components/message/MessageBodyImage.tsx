import { CSSProperties, RefObject, useEffect, useRef } from 'react';
import { SimpleMap } from '@proton/shared/lib/interfaces';
import { classnames, Icon, Tooltip } from '@proton/components';
import { createPortal } from 'react-dom';
import { c } from 'ttag';
import { getAnchor } from '../../helpers/message/messageImages';
import { MessageImage } from '../../logic/messages/messagesTypes';
import { IframeOffsetType } from './interface';

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
            !prop.startsWith('background')
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
    iframePosition: IframeOffsetType | undefined;
    isPrint?: boolean;
    iframeRef: RefObject<HTMLIFrameElement>;
}

const MessageBodyImage = ({
    showRemoteImages,
    showEmbeddedImages,
    image,
    anchor,
    iframePosition,
    isPrint,
    iframeRef,
}: Props) => {
    const imageRef = useRef<HTMLImageElement>(null);

    const { type, status, error } = image;
    const showPlaceholder =
        error || status !== 'loaded' || (type === 'remote' ? !showRemoteImages : !showEmbeddedImages);
    const showImage = !showPlaceholder;

    const attributes =
        image.original?.getAttributeNames().reduce<SimpleMap<string>>((acc, name) => {
            acc[name] = image.original?.getAttribute(name) as string;
            return acc;
        }, {}) || {};

    forEachStyle(image.original?.style, (prop, value) => {
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
        return <img ref={imageRef} src={image.url} />;
    }

    const showLoader = image.status === 'loading';

    const errorMessage = error?.data?.Error
        ? error?.data?.Error
        : c('Message image').t`Image did not load because the remote server’s identity certificate is invalid.`;

    const placeholderTooltip = error
        ? errorMessage
        : c('Message image').t`Image has not been loaded in order to protect your privacy.`;

    const icon = error ? 'circle-xmark' : 'file-shapes';

    const style = extractStyle(image.original, iframeRef.current?.contentWindow?.innerWidth);

    const placeholder = (
        <span
            style={style}
            className={classnames([
                'proton-image-placeholder',
                !!error && 'proton-image-placeholder--error border-danger',
            ])}
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
        <Tooltip title={placeholderTooltip} anchorOffset={iframePosition}>
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
