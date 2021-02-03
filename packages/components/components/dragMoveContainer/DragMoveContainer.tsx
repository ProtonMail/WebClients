import React from 'react';

interface Props {
    children: React.ReactNode;
}

const DragMoveContainer = ({ children }: Props) => (
    <div className="color-black text-bold bg-white p1 bordered-container rounded">{children}</div>
);

export default DragMoveContainer;
