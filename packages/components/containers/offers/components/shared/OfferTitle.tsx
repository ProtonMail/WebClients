import type { ReactNode } from 'react';

const OfferTitle = ({ children }: { children: ReactNode }) => (
    <h1 className="offer-main-title h3 text-center text-bold">{children}</h1>
);

export default OfferTitle;
