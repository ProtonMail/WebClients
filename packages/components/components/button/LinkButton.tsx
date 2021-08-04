import * as React from 'react';
import Button, { ButtonProps } from './Button';

export type LinkButtonProps = Omit<ButtonProps, 'shape'>;

const LinkButton = (props: LinkButtonProps, ref: React.Ref<HTMLButtonElement>) => {
    return <Button shape="link" color="norm" ref={ref} {...props} />;
};

export default React.forwardRef<HTMLButtonElement, LinkButtonProps>(LinkButton);
