import * as React from 'react';
import { QRCode } from '../../components';

interface OwnProps {
    amount: number;
    address: string;
}
const BitcoinQRCode = ({ amount, address, ...rest }: OwnProps & Omit<React.ComponentProps<typeof QRCode>, 'value'>) => {
    const url = `bitcoin:${address}?amount=${amount}`;
    return <QRCode value={url} {...rest} />;
};

export default BitcoinQRCode;
