import { ReactNode } from 'react';

const BoxContent = ({ children }: { children: ReactNode }) => {
    return <div className="pricing-box-content mt-8">{children}</div>;
};

export default BoxContent;
