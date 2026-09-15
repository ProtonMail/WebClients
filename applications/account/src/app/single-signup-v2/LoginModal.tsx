import ModalTwo from '@proton/components/components/modalTwo/Modal';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { OnLoginCallback } from '@proton/components/containers/app/interface';
import type { ProductParam } from '@proton/shared/lib/apps/product';

import type { Paths } from '../content/helper';
import LoginContainer from '../login/LoginContainer';
import { RememberMode } from '../login/rememberMode';

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
            <LoginContainer
                metaTags={null}
                productParam={productParam}
                defaultUsername={defaultUsername}
                onLogin={onLogin}
                setupVPN={true}
                paths={paths}
                modal
                remember={RememberMode.Hidden}
                onStartAuth={onStartAuth}
                render={(data) => {
                    return (
                        <>
                            <ModalTwoHeader title={data.title} subline={data.subTitle} titleClassName="text-4xl mb-1" />
                            <ModalTwoContent>{data.content}</ModalTwoContent>
                        </>
                    );
                }}
            />
        </ModalTwo>
    );
};

export default LoginModal;
