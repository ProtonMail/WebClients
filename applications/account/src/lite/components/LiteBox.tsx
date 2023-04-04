import { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

const LiteBox = ({ children }: Props) => {
    return (
        <div className="flex flex-justify-center flex-align-items-center h100">
            <div className="p4 rounded shadow-lifted on-tiny-mobile-no-box-shadow bg-norm max-w40e">{children}</div>
        </div>
    );
};

export default LiteBox;
