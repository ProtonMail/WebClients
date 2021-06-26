import React from 'react';

interface Props {
    children: React.ReactNode;
}

const DragMoveContainer = ({ children }: Props) => (
    <div className="color-norm text-bold bg-norm p1 bordered rounded">{children}</div>
);

export default DragMoveContainer;
