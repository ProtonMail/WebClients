import type { CSSProperties, ComponentPropsWithoutRef, MouseEvent, ReactNode } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Icon from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

import type { IconProps } from '../icon/Icon';

import './Info.scss';

interface Props extends Omit<IconProps, 'title' | 'name'> {
    originalPlacement?: ComponentPropsWithoutRef<typeof Tooltip>['originalPlacement'];
    url?: string;
    title?: ReactNode;
    buttonClass?: string;
    buttonTabIndex?: number;
    className?: string;
    questionMark?: boolean;
    filled?: boolean;
    fakeDisabled?: boolean;
    colorPrimary?: boolean;
    tooltipClassName?: string;
    tooltipStyle?: CSSProperties;
    openDelay?: number;
}

const Info = ({
    originalPlacement = 'top',
    url,
    title = undefined,
    buttonClass,
    buttonTabIndex,
    className = '',
    questionMark = false,
    filled = false,
    colorPrimary = true,
    fakeDisabled = false,
    tooltipClassName,
    tooltipStyle,
    openDelay = 0,
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

    if (!title && url) {
        return (
            <Href
                className={clsx(
                    'info-button inline-flex align-middle color-inherit relative rounded-full',
                    !fakeDisabled && 'interactive-pseudo interactive--no-background',
                    buttonClass
                )}
                href={url}
            >
                <Icon
                    className={clsx(colorPrimary && 'color-primary', className)}
                    name={icon()}
                    alt={c('Action').t`More info: ${safeTitle}`}
                    {...rest}
                />
            </Href>
        );
    }

    return (
        <Tooltip
            title={safeTitle}
            openDelay={openDelay}
            closeDelay={250}
            longTapDelay={0}
            originalPlacement={originalPlacement}
            tooltipClassName={tooltipClassName}
            tooltipStyle={tooltipStyle}
        >
            {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
            <button
                tabIndex={buttonTabIndex}
                className={clsx(
                    'info-button inline-flex color-inherit relative rounded-full',
                    !fakeDisabled && 'interactive-pseudo interactive--no-background',
                    buttonClass
                )}
                onClick={handleClick}
                aria-describedby={uid}
                type="button"
                role={url ? 'link' : undefined}
            >
                <Icon
                    className={clsx(colorPrimary && 'color-primary', className)}
                    name={icon()}
                    alt={c('Action').t`More info: ${safeTitle}`}
                    {...rest}
                />
            </button>
        </Tooltip>
    );
};

export default Info;
