import { type PropsWithChildren } from 'react';

import valentineSparkes from './valentine-sparkes.svg';

import './ValentineLayout25.scss';

export const ValentineOfferLayout = ({ children }: PropsWithChildren) => {
    return (
        <>
            <img src={valentineSparkes} alt="" className="absolute right-0 top-0 valentine-sparkes z-0" />
            {children}
        </>
    );
};
