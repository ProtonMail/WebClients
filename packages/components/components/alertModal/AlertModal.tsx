import { classnames } from '../../helpers';
import { ModalTwo, ModalProps, ModalTwoContent, ModalTwoFooter } from '../modalTwo';
import './AlertModal.scss';

interface AlertModalProps extends ModalProps {
    title: string;
    subline?: string;
    text: string;
    buttons: JSX.Element[];
}

const AlertModal = ({ title, subline, text, buttons, className, ...rest }: AlertModalProps) => {
    return (
        <ModalTwo small {...rest} className={classnames([className, 'alert-modal'])}>
            <div className="alert-modal-header">
                <h3 className="text-lg text-bold">{title}</h3>
                {subline && <div className="color-weak">{subline}</div>}
            </div>
            <ModalTwoContent>
                <p>{text}</p>
            </ModalTwoContent>
            <ModalTwoFooter className="flex-column flex-align-items-stretch">{buttons}</ModalTwoFooter>
        </ModalTwo>
    );
};

export default AlertModal;
