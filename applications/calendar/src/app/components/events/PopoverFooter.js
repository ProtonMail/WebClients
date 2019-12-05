import React from 'react';

const PopoverFooter = ({ children }) => {
    return (
        <footer className="flex flex-nowrap flex-spacebetween">
            {children}
        </footer>
    );
};

export default PopoverFooter;
