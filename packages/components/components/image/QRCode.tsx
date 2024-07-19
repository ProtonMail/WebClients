import type { ComponentPropsWithoutRef } from 'react';
import { forwardRef } from 'react';

import QRCodeReact from 'qrcode.react';

import clsx from '@proton/utils/clsx';

import './QRCode.scss';

interface Props extends ComponentPropsWithoutRef<'svg'> {
    size?: number;
    value: string;
}

const QRCode = forwardRef<SVGElement, Props>(({ size = 200, className, ...rest }: Props, ref) => {
    return (
        <QRCodeReact
            className={clsx(['qr-code', className])}
            size={size}
            includeMargin={false}
            ref={ref as any}
            {...rest}
            renderAs="svg"
        />
    );
});

export default QRCode;
