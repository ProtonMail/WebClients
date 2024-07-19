import type { Ref } from 'react';
import { forwardRef } from 'react';

import type { ButtonProps } from '@proton/atoms';
import { Button } from '@proton/atoms';

export type ErrorButtonProps = Omit<ButtonProps, 'color'>;

const ErrorButton = (props: ErrorButtonProps, ref: Ref<HTMLButtonElement>) => {
    return <Button color="danger" ref={ref} {...props} />;
};

export default forwardRef<HTMLButtonElement, ErrorButtonProps>(ErrorButton);
