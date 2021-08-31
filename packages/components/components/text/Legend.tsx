import { HTMLAttributes } from 'react';

const Legend = ({ children, ...rest }: HTMLAttributes<HTMLLegendElement>) => <legend {...rest}>{children}</legend>;

export default Legend;
