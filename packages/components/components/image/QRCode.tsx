import type { ComponentPropsWithoutRef, ForwardRefRenderFunction } from 'react';
import { forwardRef } from 'react';

import { QRCodeSVG } from 'qrcode.react';

import clsx from '@proton/utils/clsx';

import './QRCode.scss';

interface Props extends ComponentPropsWithoutRef<'svg'> {
    size?: number;
    value: string;
}

const BaseQRCode: ForwardRefRenderFunction<SVGSVGElement, Props> = ({ size = 200, className, ...rest }: Props, ref) => {
    return <QRCodeSVG className={clsx(['qr-code', className])} size={size} ref={ref} {...rest} />;
};

const QRCode = forwardRef(BaseQRCode);

export default QRCode;
