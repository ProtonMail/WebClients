import type { FC, PropsWithChildren } from 'react';

import protonPassIcon from '@proton/styles/assets/img/pass/protonpass-icon.svg';
import clsx from '@proton/utils/clsx';

import './LobbyLayout.scss';

type Props = { overlay: boolean };

export const LobbyLayout: FC<PropsWithChildren<Props>> = ({ overlay, children }) => {
    return (
        <div
            className="pass-lobby overflow-auto relative p-7 anime-fade-in"
            style={{ '--anime-duration': '450ms', '--anime-delay': '100ms' }}
        >
            <div
                className="absolute inset-x-center top-custom anime-fade-in"
                style={{ '--top-custom': '-200px', '--anime-duration': '550ms', '--anime-delay': '150ms' }}
            >
                <img
                    src={protonPassIcon}
                    className={clsx(
                        'pass-lobby--logo w-custom max-w-custom pointer-events-none',
                        !overlay && 'pass-lobby--logo-hidden'
                    )}
                    style={{ '--w-custom': '18.25rem' }}
                    alt=""
                />
            </div>

            <div
                className="pass-lobby--content flex flex-nowrap flex-column h-full w-custom mx-auto text-center gap-2"
                style={{ '--w-custom': '18.75rem' }}
            >
                {children}
            </div>
        </div>
    );
};
