import ModalTwo from '@proton/components/components/modalTwo/Modal';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ProductParam } from '@proton/shared/lib/apps/product';

import type { OnLoginCallback } from '../content/authSession';
import type { Paths } from '../content/helper';
import SignInContainer from '../sign-in/SignInContainer';
import type { SignInLayout, SignInLayoutHeaderProps, SignInLayoutProps } from '../sign-in/components/SignInLayout';
import { RememberMode } from '../sign-in/rememberMode';

/**
 * Each sign-in step in the modal, which stays open across steps: the heading in the modal's header, and the rest in its
 * scrolling content.
 */
const LoginModalLayout: SignInLayout = {
    Shell: function LoginModalShell({ children }: SignInLayoutProps) {
        return <>{children}</>;
    },
    Header: function LoginModalHeader({ title, subTitle }: SignInLayoutHeaderProps) {
        return <ModalTwoHeader title={title} subline={subTitle} titleClassName="text-4xl mb-1" />;
    },
    Body: ModalTwoContent,
};

interface Props extends ModalProps {
    onLogin: OnLoginCallback;
    defaultUsername?: string;
    paths: Paths;
    productParam: ProductParam;
    onStartAuth: () => Promise<void>;
}

const LoginModal = ({ productParam, paths, onLogin, onStartAuth, defaultUsername, ...rest }: Props) => {
    return (
        <ModalTwo size="small" {...rest}>
            <SignInContainer
                metaTags={null}
                productParam={productParam}
                defaultUsername={defaultUsername}
                onLogin={onLogin}
                setupVPN={true}
                paths={paths}
                layout={LoginModalLayout}
                compactForm
                remember={RememberMode.Hidden}
                onStartAuth={onStartAuth}
            />
        </ModalTwo>
    );
};

export default LoginModal;
