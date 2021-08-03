import * as React from 'react';

const Legend = ({ children, ...rest }: React.HTMLAttributes<HTMLLegendElement>) => (
    <legend {...rest}>{children}</legend>
);

export default Legend;
