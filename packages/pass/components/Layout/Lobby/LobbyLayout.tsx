import type { FC, ReactNode } from 'react';

import { PassIconLogo } from '@proton/pass/components/Layout/Logo/PassIconLogo';

import './LobbyLayout.scss';

type Props = {
    children: ReactNode;
    large?: boolean;
};

export const LobbyLayout: FC<Props> = ({ children, large }) => {
    return (
        <div
            className="pass-lobby overflow-auto relative p-7 anime-fade-in"
            style={{ '--anime-duration': '450ms', '--anime-delay': '100ms' }}
        >
            <PassIconLogo />
            <div
                className="pass-lobby--content flex flex-nowrap flex-column h-full w-custom mx-auto text-center gap-2"
                style={{ '--w-custom': large === true ? '32rem' : '18.75rem' }}
            >
                {children}
            </div>
        </div>
    );
};
