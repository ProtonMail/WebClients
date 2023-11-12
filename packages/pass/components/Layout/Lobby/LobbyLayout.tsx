import type { FC } from 'react';

import protonPassIcon from '@proton/pass/assets/protonpass-icon.svg';
import { FadeIn } from '@proton/pass/components/Layout/Animation/FadeIn';
import clsx from '@proton/utils/clsx';

import './LobbyLayout.scss';

export const LobbyLayout: FC<{ overlay: boolean }> = ({ overlay, children }) => {
    return (
        <FadeIn className="pass-lobby relative p-7" duration={450} delay={100}>
            <FadeIn
                className="absolute absolute-center-x top-custom"
                style={{ '--top-custom': '-200px' }}
                delay={150}
                duration={550}
            >
                <img
                    src={protonPassIcon}
                    className={clsx('pass-lobby--logo w-custom max-w-custom', !overlay && 'pass-lobby--logo-hidden')}
                    style={{ '--w-custom': '18.25rem' }}
                    alt=""
                />
            </FadeIn>

            <div
                className="pass-lobby--content flex flex-column h-full w-custom mx-auto text-center gap-2"
                style={{ '--w-custom': '18.75rem' }}
            >
                {children}
            </div>
        </FadeIn>
    );
};
