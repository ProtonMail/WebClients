import * as React from 'react';
import Button, { ButtonProps } from './Button';

export type ErrorButtonProps = Omit<ButtonProps, 'color'>;

const ErrorButton = (props: ErrorButtonProps, ref: React.Ref<HTMLButtonElement>) => {
    return <Button color="danger" ref={ref} {...props} />;
};

export default React.forwardRef<HTMLButtonElement, ErrorButtonProps>(ErrorButton);
