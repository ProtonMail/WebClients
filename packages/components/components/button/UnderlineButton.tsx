import { forwardRef, Ref } from 'react';
import Button, { ButtonProps } from './Button';

export type UnderlineButtonProps = Omit<ButtonProps, 'shape'>;

const UnderlineButton = (props: UnderlineButtonProps, ref: Ref<HTMLButtonElement>) => {
    return <Button shape="underline" color="norm" ref={ref} {...props} />;
};

export default forwardRef<HTMLButtonElement, UnderlineButtonProps>(UnderlineButton);
