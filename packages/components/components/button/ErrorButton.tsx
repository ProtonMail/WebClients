import { forwardRef, Ref } from 'react';
import Button, { ButtonProps } from './Button';

export type ErrorButtonProps = Omit<ButtonProps, 'color'>;

const ErrorButton = (props: ErrorButtonProps, ref: Ref<HTMLButtonElement>) => {
    return <Button color="danger" ref={ref} {...props} />;
};

export default forwardRef<HTMLButtonElement, ErrorButtonProps>(ErrorButton);
