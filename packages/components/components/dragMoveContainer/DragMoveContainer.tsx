import { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

const DragMoveContainer = ({ children }: Props) => (
    <div className="color-norm text-bold bg-norm p-4 border rounded">{children}</div>
);

export default DragMoveContainer;
