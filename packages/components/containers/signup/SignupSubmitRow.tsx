import React from 'react';

interface Props {
    children: React.ReactNode;
}
const SignupSubmitRow = ({ children }: Props) => {
    return <div className="flex flex-nowrap flex-justify-end flex-items-center mb2">{children}</div>;
};

export default SignupSubmitRow;
