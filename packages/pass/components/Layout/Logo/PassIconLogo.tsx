import type { FC } from 'react';

import protonPassIcon from '@proton/styles/assets/img/pass/protonpass-icon.svg';

export const PassIconLogo: FC = () => (
    <div
        className="absolute inset-x-center top-custom anime-fade-in"
        style={{ '--top-custom': '-200px', '--anime-duration': '550ms', '--anime-delay': '150ms' }}
    >
        <img
            src={protonPassIcon}
            className="pass-lobby--logo w-custom max-w-custom pointer-events-none"
            style={{ '--w-custom': '18.25rem' }}
            alt="Pass Main Icon"
        />
    </div>
);
