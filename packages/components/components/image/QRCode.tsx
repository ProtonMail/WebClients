import React from 'react';
import QRCodeReact from 'qrcode.react';

import { classnames } from '../../helpers';

interface Props extends React.ComponentPropsWithoutRef<'svg'> {
    size?: number;
    value: string;
}

const QRCode = React.forwardRef<SVGElement, Props>(({ size = 200, className, ...rest }: Props, ref) => {
    return (
        <QRCodeReact
            className={classnames(['qr-code', className])}
            size={size}
            includeMargin={false}
            ref={ref as any}
            {...rest}
            renderAs="svg"
        />
    );
});

export default QRCode;
