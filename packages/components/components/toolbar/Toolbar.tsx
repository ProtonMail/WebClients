import React from 'react';

interface Props {
    children: React.ReactNode;
}

const Toolbar = ({ children }: Props) => <div className="toolbar flex flex-nowrap no-scroll noprint">{children}</div>;

export default Toolbar;
