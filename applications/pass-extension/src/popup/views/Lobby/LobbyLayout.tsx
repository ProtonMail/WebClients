import type { FC } from 'react';

import clsx from '@proton/utils/clsx';

import { FadeIn } from '../../../shared/components/animation/FadeIn';

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
                    src="/assets/protonpass-icon.svg"
                    className={clsx('pass-lobby--logo w-custom max-w-custom', !overlay && 'pass-lobby--logo-hidden')}
                    style={{ '--width-custom': '292px' }}
                    alt=""
                />
            </FadeIn>

            <div className="pass-lobby--content flex flex-column h100 w300p mx-auto text-center gap-2">{children}</div>
        </FadeIn>
    );
};
