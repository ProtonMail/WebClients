import { ComponentPropsWithoutRef, MouseEvent, ReactNode, useState } from 'react';

import { c } from 'ttag';

import { classnames, generateUID } from '../../helpers';
import Icon, { IconProps } from '../icon/Icon';
import Tooltip from '../tooltip/Tooltip';

interface Props extends Omit<IconProps, 'title' | 'name'> {
    originalPlacement?: ComponentPropsWithoutRef<typeof Tooltip>['originalPlacement'];
    url?: string;
    title?: ReactNode;
    buttonClass?: string;
    buttonTabIndex?: number;
    className?: string;
    questionMark?: boolean;
    colorPrimary?: boolean;
}

const Info = ({
    originalPlacement = 'top',
    url,
    title = undefined,
    buttonClass = 'inline-flex color-inherit',
    buttonTabIndex,
    className = '',
    questionMark = false,
    colorPrimary = true,
    ...rest
}: Props) => {
    const [uid] = useState(generateUID('tooltip'));

    const handleClick = (event: MouseEvent) => {
        event.preventDefault();
        if (url) {
            window.open(url);
        }
    };

    const safeTitle = title || '';

    return (
        <Tooltip title={safeTitle} openDelay={0} closeDelay={250} originalPlacement={originalPlacement}>
            <button
                tabIndex={buttonTabIndex}
                className={buttonClass}
                onClick={handleClick}
                aria-describedby={uid}
                type="button"
                role={url ? 'link' : undefined}
            >
                <Icon
                    className={classnames(['icon-16p', colorPrimary && 'color-primary', className])}
                    name={questionMark ? 'question-circle' : 'info-circle'}
                    alt={c('Action').t`More info: ${safeTitle}`}
                    {...rest}
                />
            </button>
        </Tooltip>
    );
};

export default Info;
