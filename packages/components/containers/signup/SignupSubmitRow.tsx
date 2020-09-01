import React from 'react';

interface Props {
    children: React.ReactNode;
}
const SignupSubmitRow = ({ children }: Props) => {
    return (
        <div className="flex flex-nowrap flex-justify-end flex-items-center mb2 onmobile-flex-column">{children}</div>
    );
};

export default SignupSubmitRow;
