import { Ref, forwardRef } from 'react';

import ButtonLike, { ButtonLikeProps } from '../ButtonLike/ButtonLike';

export interface ButtonProps extends Omit<ButtonLikeProps<'button'>, 'as' | 'ref'> {}

const Button = (props: ButtonProps, ref: Ref<HTMLButtonElement>) => {
    return <ButtonLike type="button" ref={ref} {...props} as="button" />;
};

export default forwardRef<HTMLButtonElement, ButtonProps>(Button);
