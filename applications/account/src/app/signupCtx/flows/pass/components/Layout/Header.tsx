import type { FC } from 'react';

import { PassLogo } from '@proton/components';

export const Header: FC = () => (
    <header
        className="flex justify-center items-center gap-4 py-4 px-4 md:px-8 mx-auto"
        style={{
            '--logo-text-proton-color': 'white',
            '--logo-text-product-color': 'white',
        }}
    >
        <PassLogo />
    </header>
);
