import paypalSvg from '@proton/styles/assets/img/bank-icons/paypal-color.svg';
import { classnames } from '../../helpers';
import PayPalButton, { PayPalButtonProps } from './PayPalButton';
import './StyledPayPalButton.scss';

type Props = Omit<PayPalButtonProps, 'children' | 'shape' | 'color' | 'icon'>;

const StyledPayPalButton = ({ className, ...rest }: Props) => {
    const payPalButtonClassName = classnames(['paypal-button', className]);

    return (
        <PayPalButton {...rest} className={payPalButtonClassName} color="norm">
            <img src={paypalSvg} alt="PayPal" width="50" />
        </PayPalButton>
    );
};

export default StyledPayPalButton;
