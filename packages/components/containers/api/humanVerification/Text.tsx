import { ReactNode } from 'react';

const Text = ({ children }: { children: ReactNode }) => {
    return <div className="mb2 mt0-5">{children}</div>;
};

export default Text;
