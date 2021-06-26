import React from 'react';
import ReactDOM from 'react-dom';

interface Props {
    children: React.ReactNode;
}

const Portal = ({ children }: Props) => {
    return ReactDOM.createPortal(children, document.body);
};

export default Portal;
