import paypalSvg from '@proton/styles/assets/img/bank-icons/paypal-color.svg';
import clsx from '@proton/utils/clsx';

import PayPalButton, { LegacyPayPalButtonProps, NewPayPalButtonProps } from './PayPalButton';

import './StyledPayPalButton.scss';

type Omitted = 'children' | 'shape' | 'color' | 'icon';
type Props = Omit<LegacyPayPalButtonProps, Omitted> | Omit<NewPayPalButtonProps, Omitted>;

const StyledPayPalButton = ({ className, ...rest }: Props) => {
    const payPalButtonClassName = clsx(['paypal-button', className]);

    return (
        <PayPalButton {...rest} className={payPalButtonClassName} color="norm">
            <img src={paypalSvg} alt="PayPal" width="50" />
        </PayPalButton>
    );
};

export default StyledPayPalButton;
