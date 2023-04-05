import { c } from 'ttag';

import dragAndDrop from '@proton/styles/assets/img/illustrations/drag-and-drop-img.svg';
import clsx from '@proton/utils/clsx';

import { DropzoneProps } from './Dropzone';

export interface DropzoneContentProps
    extends Pick<DropzoneProps, 'size' | 'shape' | 'rounded' | 'border' | 'customContent' | 'className'> {
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
}: DropzoneContentProps) => {
    const isSmallDropView = size === 'small';
    const isLargeDropView = size === 'large';

    const isTransparentShape = shape === 'transparent';
    const isFlashyShape = shape === 'flashy';

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
                prefixClasses('flex flex-justify-center flex-align-items-center'),
                embedded ? 'dropzone-content--embedded' : 'h100 w100 absolute-cover',
                rounded && prefixClasses('rounded-xl'),
                border && 'dropzone--bordered',
                isTransparentShape && 'dropzone-content--transparent',
                isFlashyShape && 'dropzone-content--flashy',
                className
            )}
        >
            {customContent ? (
                customContent
            ) : (
                <div className={prefixClasses('text-center')}>
                    {!isSmallDropView && (
                        <img src={dragAndDrop} alt="" aria-hidden="true" className={prefixClasses('mb1')} />
                    )}
                    {isLargeDropView ? (
                        <p className={prefixClasses('mb0 mt1-5')}>
                            <span className={prefixClasses('text-xl text-bold')}>{c('Info').t`Drop to import`}</span>
                            <br />
                            <span className={!isFlashyShape ? prefixClasses('color-weak') : undefined}>
                                {c('Info').t`Your files will be encrypted and then saved`}
                            </span>
                        </p>
                    ) : (
                        <p className={clsx(prefixClasses('m0'), !isFlashyShape && prefixClasses('color-weak'))}>
                            {c('Info').t`Drop file here to upload`}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default DropzoneContent;
