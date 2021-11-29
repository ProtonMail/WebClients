import { noop } from '@proton/shared/lib/helpers/function';
import { HTMLAttributes, ReactNode, useEffect, useState } from 'react';
import { c } from 'ttag';
import { classnames } from '../../helpers';

import './Dropzone.scss';

type Props = (HTMLAttributes<HTMLDivElement> &
    Required<Pick<HTMLAttributes<HTMLDivElement>, 'onDrop' | 'onDragEnter' | 'onDragLeave'>>) & {
    /**
     * When true, reveals the overlay and content
     */
    isHovered: boolean;
    /**
     * The content to show when dragging over the dropzone
     */
    content?: ReactNode;
    isDisabled?: boolean;
};

const Dropzone = ({
    children,
    isHovered,
    onDrop,
    onDragEnter,
    onDragLeave,
    className,
    content,
    isDisabled = false,
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

    const getContent = () => {
        if (!content) {
            return <span className="dropzone-text">{c('Info').t`Drop the file here to upload`}</span>;
        }

        return content;
    };

    return (
        <div
            className={className}
            onDrop={!isDisabled ? onDrop : noop}
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
                    !isDisabled && allowHover && isHovered && 'is-hovered',
                ])}
                onDragLeave={onDragLeave}
            >
                <div className="no-pointer-events">{getContent()}</div>
            </div>

            <div className="dropzone-content flex flex-align-items-center flex-justify-center w100 h100">
                {children}
            </div>
        </div>
    );
};

export default Dropzone;
