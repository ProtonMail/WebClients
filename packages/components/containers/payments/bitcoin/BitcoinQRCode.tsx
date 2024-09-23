import type { ComponentProps } from 'react';

import { CircleLoader } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import QRCode from '@proton/components/components/image/QRCode';
import clsx from '@proton/utils/clsx';

import './BitcoinQRCode.scss';

export interface OwnProps {
    amount: number;
    address: string;
    status: 'initial' | 'pending' | 'confirmed';
}

const BitcoinQRCode = ({
    amount,
    address,
    status,
    className,
    ...rest
}: OwnProps & Omit<ComponentProps<typeof QRCode>, 'value'>) => {
    const url = `bitcoin:${address}?amount=${amount}`;
    const blurred = status === 'pending' || status === 'confirmed' ? 'blurred' : null;

    return (
        <div className="border rounded relative p-6">
            <QRCode value={url} className={clsx(className, blurred)} {...rest} />
            {status === 'pending' && <CircleLoader size="medium" className="absolute inset-center" />}
            {status === 'confirmed' && (
                <Icon name="checkmark-circle" size={9} className="absolute inset-center color-success" />
            )}
        </div>
    );
};

export default BitcoinQRCode;
