import { forwardRef, Ref } from 'react';
import ButtonLike, { ButtonLikeProps } from './ButtonLike';

export interface ButtonProps extends Omit<ButtonLikeProps<'button'>, 'as' | 'ref'> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>((props: ButtonProps, ref: Ref<HTMLButtonElement>) => {
    return <ButtonLike type="button" ref={ref} {...props} as="button" />;
});

export default Button;
