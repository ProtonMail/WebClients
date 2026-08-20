import type { ReactNode } from 'react';
import ReactDOM from 'react-dom';

interface Props {
    children: ReactNode;
}

export const Portal = ({ children }: Props) => {
    return ReactDOM.createPortal(children, document.body);
};
