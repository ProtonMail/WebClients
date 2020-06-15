import React from 'react';

interface Props {
    children?: React.ReactNode;
}
const PopoverFooter = ({ children }: Props) => {
    return <footer className="flex pb1 pt1 flex-nowrap flex-spacebetween flex-justify-end">{children}</footer>;
};

export default PopoverFooter;
