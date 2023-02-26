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
    filled?: boolean;
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
    filled = false,
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
    const icon = () => {
        if (questionMark && !filled) {
            return 'question-circle';
        } else if (questionMark && filled) {
            return 'question-circle-filled';
        } else if (!questionMark && filled) {
            return 'info-circle-filled';
        }
        return 'info-circle';
    };

    return (
        <Tooltip
            title={safeTitle}
            openDelay={0}
            closeDelay={250}
            longTapDelay={0}
            originalPlacement={originalPlacement}
        >
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
                    name={icon()}
                    alt={c('Action').t`More info: ${safeTitle}`}
                    {...rest}
                />
            </button>
        </Tooltip>
    );
};

export default Info;
