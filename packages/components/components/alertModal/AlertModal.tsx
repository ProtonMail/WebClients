import { ReactNode, useContext } from 'react';

import { classnames } from '../../helpers';
import { ModalTwo, ModalProps, ModalTwoContent, ModalTwoFooter, ModalContext } from '../modalTwo';
import './AlertModal.scss';

const AlertModalTitle = ({ children }: { children: ReactNode }) => (
    <h3 id={useContext(ModalContext).id} className="text-lg text-bold">
        {children}
    </h3>
);

interface AlertModalProps extends Omit<ModalProps, 'children'> {
    title: string;
    subline?: string;
    buttons: JSX.Element;
    children: ReactNode;
}

const AlertModal = ({ title, subline, buttons, className, children, ...rest }: AlertModalProps) => {
    return (
        <ModalTwo small {...rest} className={classnames([className, 'alert-modal'])}>
            <div className="alert-modal-header">
                <AlertModalTitle>{title}</AlertModalTitle>
                {subline && <div className="color-weak">{subline}</div>}
            </div>
            <ModalTwoContent>{children}</ModalTwoContent>
            <ModalTwoFooter className="flex-column flex-align-items-stretch">{buttons}</ModalTwoFooter>
        </ModalTwo>
    );
};

export default AlertModal;
