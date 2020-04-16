import React from 'react';

interface Props {
    children?: React.ReactNode;
}
const PopoverContent = ({ children }: Props) => {
    return <div className="pb0-5">{children}</div>;
};

export default PopoverContent;
