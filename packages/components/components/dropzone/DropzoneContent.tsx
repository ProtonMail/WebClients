import { c } from 'ttag';

import type { DropzoneProps } from '@proton/components/components/dropzone/Dropzone';
import dragAndDrop from '@proton/styles/assets/img/illustrations/drag-and-drop-img.svg';
import clsx from '@proton/utils/clsx';

export interface DropzoneContentProps
    extends Pick<
        DropzoneProps,
        'size' | 'shape' | 'rounded' | 'border' | 'customContent' | 'className' | 'contentTitle' | 'contentSubText'
    > {
    /** Embedded in iframe */
    embedded?: boolean;
}

const DropzoneContent = ({
    border,
    className,
    customContent,
    rounded,
    shape,
    size,
    embedded = false,
    contentTitle = c('Info').t`Drop to import`,
    contentSubText,
}: DropzoneContentProps) => {
    const isSmallDropView = size === 'small';
    const isLargeDropView = size === 'large';

    const isTransparentShape = shape === 'transparent';
    const isFlashyShape = shape === 'flashy';
    const isWhite = shape === 'white';

    const getSubText = () => {
        if (contentSubText) {
            return contentSubText;
        } else {
            if (isLargeDropView) {
                return c('Info').t`Your files will be encrypted and then saved`;
            } else {
                return c('Info').t`Drop file here to upload`;
            }
        }
    };

    const subText = getSubText();

    /** Prefix css classes with `proton-` for iframe embedded situation */
    const prefixClasses = (classes: string) =>
        embedded
            ? classes
                  .split(' ')
                  .map((className) => `proton-${className}`)
                  .join(' ')
            : classes;

    return (
        <div
            className={clsx(
                'dropzone-content dropzone-content--hovered',
                prefixClasses('flex justify-center items-center'),
                embedded ? 'dropzone-content--embedded' : 'h-full w-full absolute inset-0',
                rounded && prefixClasses('rounded-xl'),
                border && 'dropzone--bordered',
                isTransparentShape && 'dropzone-content--transparent',
                isFlashyShape && 'dropzone-content--flashy',
                isWhite && 'dropzone-content--white',
                className
            )}
        >
            {customContent ? (
                customContent
            ) : (
                <div className={prefixClasses('text-center')}>
                    {!isSmallDropView && (
                        <img src={dragAndDrop} alt="" aria-hidden="true" className={prefixClasses('mb-4')} />
                    )}
                    {isLargeDropView ? (
                        <p className={prefixClasses('mb-0 mt-5')}>
                            <span className={prefixClasses('text-xl text-bold')}>{contentTitle}</span>
                            <br />
                            <span className={!isFlashyShape ? prefixClasses('color-weak') : undefined}>{subText}</span>
                        </p>
                    ) : (
                        <p className={clsx(prefixClasses('m-0'), !isFlashyShape && prefixClasses('color-weak'))}>
                            {subText}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default DropzoneContent;
