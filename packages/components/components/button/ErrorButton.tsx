import { Ref, forwardRef } from 'react';

import { Button, ButtonProps } from '@proton/atoms';

export type ErrorButtonProps = Omit<ButtonProps, 'color'>;

const ErrorButton = (props: ErrorButtonProps, ref: Ref<HTMLButtonElement>) => {
    return <Button color="danger" ref={ref} {...props} />;
};

export default forwardRef<HTMLButtonElement, ErrorButtonProps>(ErrorButton);
