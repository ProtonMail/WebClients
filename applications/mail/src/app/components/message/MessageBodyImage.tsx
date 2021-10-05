import { CSSProperties, RefObject, useEffect, useRef, useState } from 'react';
import { SimpleMap } from '@proton/shared/lib/interfaces';
import { classnames, Icon, Loader, Tooltip } from '@proton/components';
import { createPortal } from 'react-dom';
import { c } from 'ttag';
import { getAnchor } from '../../helpers/message/messageImages';
import { MessageImage } from '../../models/message';

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

const extractStyle = (original: HTMLElement | undefined): CSSProperties => {
    if (!original) {
        return {};
    }
    const style: CSSProperties = {};
    forEachStyle(original.style, (prop, value) => {
        if (prop !== 'display') {
            style[spineToCamelCase(prop)] = value;
        }
    });
    sizeProps.forEach((prop) => {
        const value = original?.getAttribute(prop)?.trim();
        if (value?.endsWith('%') || value === 'auto') {
            style[prop] = value;
        } else if (value) {
            style[prop] = `${value}px`;
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
}

const MessageBodyImage = ({ showRemoteImages, showEmbeddedImages, image, anchor }: Props) => {
    const imageRef = useRef<HTMLImageElement>(null);
    const [isError, setIsError] = useState(false);

    const { type } = image;
    const showPlaceholder =
        isError || image.status !== 'loaded' || (type === 'remote' ? !showRemoteImages : !showEmbeddedImages);
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

    const handleError = () => {
        setIsError(true);
    };

    if (showImage) {
        // eslint-disable-next-line jsx-a11y/alt-text
        return <img ref={imageRef} src={image.url} onError={handleError} />;
    }

    const showLoader = image.status === 'loading';

    const placeholderTooltip = isError
        ? c('Message image').t`Image did not load because the remote server’s identity certificate is invalid.`
        : c('Message image').t`Image has not been loaded in order to protect your privacy.`;

    const icon = isError ? 'circle-xmark' : 'file-shapes';

    const style = extractStyle(image.original);

    // showPlaceholder
    return (
        <Tooltip title={placeholderTooltip}>
            <span
                style={style}
                className={classnames([
                    'proton-image-placeholder inline-flex bordered rounded flex-justify-center flex-align-items-center',
                    isError && 'color-danger border--danger',
                ])}
            >
                {!showLoader ? <Icon name={icon} size={20} /> : null}

                {showLoader ? <Loader className="" /> : null}
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
