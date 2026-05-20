import React from 'react';

import { clsx } from 'clsx';

import { Avatar } from '@proton/atoms/Avatar/Avatar';
import { Button } from '@proton/atoms/Button/Button';
import { Icon } from '@proton/components/index';
import type { IconName } from '@proton/icons/types';

interface SettingsSectionItemProps {
    icon: IconName;
    text: string | React.ReactNode;
    subtext?: string | React.ReactNode;
    button?: React.ReactNode;
    useEllipsisOnContent?: boolean;
}

export const SettingsSectionItem = ({
    icon,
    text,
    subtext,
    button,
    useEllipsisOnContent,
}: SettingsSectionItemProps) => {
    const subTextContent =
        typeof subtext === 'string' ? (
            <span
                className={clsx('color-weak', useEllipsisOnContent && 'text-ellipsis')}
                title={useEllipsisOnContent ? subtext : undefined}
            >
                {subtext}
            </span>
        ) : (
            subtext
        );

    return (
        <div className="flex flex-row flex-nowrap gap-2 md:gap-4 items-start p-2">
            <Avatar color="weak" className="settings-section-icon">
                <Icon className="shrink-0 color-weak" name={icon} size={5} />
            </Avatar>
            <div className="flex-1 flex flex-column *:min-size-auto sm:flex-row flex-nowrap gap-2">
                <div className="flex flex-column flex-nowrap flex-1 min-w-0">
                    {typeof text === 'string' ? (
                        <span
                            className={clsx('text-semibold', useEllipsisOnContent && 'text-ellipsis')}
                            title={useEllipsisOnContent ? text : undefined}
                        >
                            {text}
                        </span>
                    ) : (
                        text
                    )}
                    {subtext ? subTextContent : null}
                </div>
                <div className="shrink-0 my-auto">{button}</div>
            </div>
        </div>
    );
};

interface SettingsSectionItemButtonProps extends SettingsSectionItemProps {
    onClick: () => void;
}

export const SettingsSectionItemButton = ({
    icon,
    text,
    subtext,
    button,
    onClick,
    useEllipsisOnContent,
}: SettingsSectionItemButtonProps & { useEllipsisOnContent?: boolean }) => {
    const subTextContent =
        typeof subtext === 'string' ? (
            <span
                className={clsx('color-weak', useEllipsisOnContent && 'text-ellipsis')}
                title={useEllipsisOnContent ? subtext : undefined}
            >
                {subtext}
            </span>
        ) : (
            subtext
        );

    return (
        <Button
            className="flex flex-row flex-nowrap gap-2 md:gap-4 items-start p-2"
            onClick={onClick}
            shape="ghost"
            fullWidth
        >
            <Avatar color="weak" className="settings-section-icon">
                <Icon className="shrink-0 color-weak" name={icon} size={5} />
            </Avatar>
            <div className="flex-1 flex flex-row *:min-size-auto flex-nowrap gap-2">
                <div className="flex flex-column flex-nowrap flex-1 min-w-0 items-baseline">
                    {typeof text === 'string' ? (
                        <span
                            className={clsx('text-semibold', useEllipsisOnContent && 'text-ellipsis')}
                            title={useEllipsisOnContent ? text : undefined}
                        >
                            {text}
                        </span>
                    ) : (
                        text
                    )}
                    <span className="text-left">{subtext ? subTextContent : null}</span>
                </div>
                <div className="shrink-0 my-auto">{button}</div>
            </div>
        </Button>
    );
};
