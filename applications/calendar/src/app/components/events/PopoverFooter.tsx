import React from 'react';

interface Props {
    children?: React.ReactNode;
}
const PopoverFooter = ({ children }: Props) => {
    return <footer className="flex pb1 flex-nowrap flex-spacebetween">{children}</footer>;
};

export default PopoverFooter;
