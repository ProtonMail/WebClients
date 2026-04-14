import type { AuthButtonProps, BaseAuthProps } from './AuthActionButton';
import { AuthActionButton } from './AuthActionButton';

export const SignInLink = ({ className }: BaseAuthProps) => {
    return <AuthActionButton variant="link" action="signin" className={className} />;
};

export const SignInButton = (props: AuthButtonProps) => {
    return <AuthActionButton variant="button" action="signin" {...props} />;
};
