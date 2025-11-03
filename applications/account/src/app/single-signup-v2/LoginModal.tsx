import type { ModalProps, OnLoginCallback } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components';
import type { ProductParam } from '@proton/shared/lib/apps/product';

import type { Paths } from '../content/helper';
import LoginContainer, { RememberMode } from '../login/LoginContainer';

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
                remember={RememberMode.Hide}
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
