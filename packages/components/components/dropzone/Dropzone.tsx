import { useEffect, useState } from 'react';
import * as React from 'react';
import { c } from 'ttag';
import { classnames } from '../../helpers';

import './Dropzone.scss';

type Props = (React.HTMLAttributes<HTMLDivElement> &
    Required<Pick<React.HTMLAttributes<HTMLDivElement>, 'onDrop' | 'onDragEnter' | 'onDragLeave'>>) & {
    /**
     * When true, reveals the overlay and content
     */
    isHovered: boolean;
    /**
     * The content to show when dragging over the dropzone
     */
    content?: React.ReactNode;
};

const Dropzone = ({
    children,
    isHovered,
    onDrop,
    onDragEnter,
    onDragLeave,
    className,
    content = c('Info').t`Drop the file here to upload`,
    ...rest
}: Props) => {
    const [allowHover, setAllowHover] = useState(true);

    useEffect(() => {
        // When dragging over quickly and accidentally dropping the file in the browser window,
        // the browser prompts to handle it and you remain in the hovered state
        const onBlur = () => {
            setAllowHover(false);
        };
        // In case the UI bugs out
        const timeout = setTimeout(() => {
            if (isHovered) {
                setAllowHover(false);
            }
        }, 5000);

        window.addEventListener('blur', onBlur);

        return () => {
            window.removeEventListener('blur', onBlur);
            clearTimeout(timeout);
        };
    }, [isHovered]);

    return (
        <div
            className={className}
            onDrop={onDrop}
            onDragEnter={(event) => {
                setAllowHover(true);
                onDragEnter(event);
            }}
            onDragOver={(event) => event.preventDefault()}
            {...rest}
        >
            <div
                className={classnames([
                    'dropzone covered-absolute flex flex-justify-center flex-align-items-center',
                    allowHover && isHovered && 'is-hovered',
                ])}
                onDragLeave={onDragLeave}
            >
                <span className="dropzone-text no-pointer-events">{content}</span>
            </div>

            <div className="dropzone-content flex flex-align-items-center flex-justify-center w100">{children}</div>
        </div>
    );
};

export default Dropzone;
