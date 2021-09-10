import { ReactNode } from 'react';
import ReactDOM from 'react-dom';

interface Props {
    children: ReactNode;
}

const Portal = ({ children }: Props) => {
    return ReactDOM.createPortal(children, document.body);
};

export default Portal;
