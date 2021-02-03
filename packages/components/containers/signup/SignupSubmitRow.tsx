import React from 'react';

interface Props {
    children: React.ReactNode;
}
const SignupSubmitRow = ({ children }: Props) => {
    return (
        <div className="flex flex-nowrap flex-justify-end flex-align-items-center mb2 on-mobile-flex-column">
            {children}
        </div>
    );
};

export default SignupSubmitRow;
