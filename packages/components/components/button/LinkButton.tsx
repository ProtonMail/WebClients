import { forwardRef, Ref } from 'react';
import Button, { ButtonProps } from './Button';

export type LinkButtonProps = Omit<ButtonProps, 'shape'>;

const LinkButton = (props: LinkButtonProps, ref: Ref<HTMLButtonElement>) => {
    return <Button shape="link" color="norm" ref={ref} {...props} />;
};

export default forwardRef<HTMLButtonElement, LinkButtonProps>(LinkButton);
