import React, { CSSProperties, RefObject, useEffect, useRef, useState } from 'react';
import { SimpleMap } from 'proton-shared/lib/interfaces';
import { classnames, Icon, Loader, Tooltip } from 'react-components';
import { createPortal } from 'react-dom';
import { c } from 'ttag';
import { getAnchor } from '../../helpers/message/messageImages';
import { MessageEmbeddedImage, MessageImage } from '../../models/message';

const sizeProps: ['width', 'height'] = ['width', 'height'];

const sizeToStyle = (attributes: SimpleMap<string>) => {
    const style: CSSProperties = {};
    sizeProps.forEach((prop) => {
        const value = attributes[prop]?.trim();
        if (value?.endsWith('%') || value === 'auto') {
            style[prop] = value;
        } else if (value) {
            style[prop] = `${value}px`;
        } else {
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
}

const MessageBodyImage = ({ showRemoteImages, showEmbeddedImages, image, anchor }: Props) => {
    const imageRef = useRef<HTMLImageElement>(null);
    const [isError, setIsError] = useState(false);

    const { type } = image;
    const showPlaceholder =
        isError ||
        (type === 'remote'
            ? !showRemoteImages
            : !showEmbeddedImages || (image as MessageEmbeddedImage).status !== 'loaded');
    const showImage = !showPlaceholder;
    const showLoader = type === 'remote' ? false : (image as MessageEmbeddedImage).status === 'loading';
    // Avoid nested ternary
    let placeholderTooltip = '';
    if (showPlaceholder) {
        placeholderTooltip = isError
            ? c('Message image').t`Image could not be loaded`
            : c('Message image').t`Image has not been loaded in order to protect your privacy`;
    }
    const icon = isError ? 'delete' : 'remote-content';

    const attributes =
        image.original?.getAttributeNames().reduce<SimpleMap<string>>((acc, name) => {
            acc[name] = image.original?.getAttribute(name) as string;
            return acc;
        }, {}) || {};

    const sizeStyle = sizeToStyle(attributes);

    sizeProps.forEach((prop) => {
        anchor.style[prop] = showPlaceholder ? (sizeStyle[prop] as string) : '';
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

    const handleError = () => {
        setIsError(true);
    };

    return (
        <Tooltip title={placeholderTooltip}>
            <span
                style={sizeStyle}
                className={classnames([
                    showPlaceholder &&
                        'proton-image-placeholder inline-flex bordered rounded flex-justify-center flex-align-items-center',
                    isError && 'color-danger border--danger',
                ])}
            >
                {showPlaceholder && !showLoader ? <Icon name={icon} size={20} /> : null}

                {showPlaceholder && showLoader ? <Loader className="" /> : null}

                {showImage ? (
                    // eslint-disable-next-line jsx-a11y/alt-text
                    <img ref={imageRef} src={image.url} onError={handleError} />
                ) : null}
            </span>
        </Tooltip>
    );
};

interface PortalProps extends Omit<Props, 'anchor'> {
    bodyRef: RefObject<HTMLDivElement>;
}

const MessageBodyImagePortal = ({ bodyRef, ...props }: PortalProps) => {
    const anchor = getAnchor(bodyRef.current, props.image);

    if (!anchor) {
        return null;
    }

    return createPortal(<MessageBodyImage {...props} anchor={anchor} />, anchor);
};

export default MessageBodyImagePortal;
