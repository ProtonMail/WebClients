import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface Props {
    children: React.ReactNode;
}

const Portal = ({ children }: Props) => {
    const [target, setTarget] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setTarget(document.body);
    }, []);

    return <>{target ? ReactDOM.createPortal(children, target) : null}</>;
};

export default Portal;
