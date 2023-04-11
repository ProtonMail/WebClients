import * as React from 'react';

import { Tooltip } from '@proton/components';
import clsx from '@proton/utils/clsx';

interface Props {
    icon: React.ReactNode;
    text: string;
    extraText?: string;
    title: string;
    initials: string;
    tooltip: string;
    className?: string;
}

const Participant = ({ icon, text, title, tooltip, initials, extraText, className }: Props) => {
    return (
        <div className={clsx(['participant flex flex-nowrap flex-align-items-center', className])}>
            <Tooltip title={tooltip}>
                <div className="participant-display item-icon relative flex flex-item-noshrink flex-align-items-center flex-justify-center">
                    <div className="item-abbr">{initials}</div>
                    <span className="participant-status">{icon}</span>
                </div>
            </Tooltip>
            <Tooltip title={title}>
                <div className="ml1">
                    <div className="max-w100 text-ellipsis participant-text text-ellipsis">{text}</div>
                    {!!extraText && (
                        <div className="max-w100 text-ellipsis participant-extra-text color-weak text-sm m-0">
                            {extraText}
                        </div>
                    )}
                </div>
            </Tooltip>
        </div>
    );
};

export default Participant;
