import type { FC } from 'react';

import protonPassIcon from '@proton/pass/assets/protonpass-icon.svg';
import clsx from '@proton/utils/clsx';

import './LobbyLayout.scss';

export const LobbyLayout: FC<{ overlay: boolean }> = ({ overlay, children }) => {
    return (
        <div
            className="pass-lobby relative p-7 anime-fade-in"
            style={{ '--anime-duration': '450ms', '--anime-delay': '100ms' }}
        >
            <div
                className="absolute absolute-center-x top-custom anime-fade-in"
                style={{ '--top-custom': '-200px', '--anime-duration': '550ms', '--anime-delay': '150ms' }}
            >
                <img
                    src={protonPassIcon}
                    className={clsx('pass-lobby--logo w-custom max-w-custom', !overlay && 'pass-lobby--logo-hidden')}
                    style={{ '--w-custom': '18.25rem' }}
                    alt=""
                />
            </div>

            <div
                className="pass-lobby--content flex flex-column h-full w-custom mx-auto text-center gap-2"
                style={{ '--w-custom': '18.75rem' }}
            >
                {children}
            </div>
        </div>
    );
};
