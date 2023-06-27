import { ModalProps, ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components/components';
import { OnLoginCallback } from '@proton/components/containers';

import LoginContainer from '../login/LoginContainer';

interface Props extends ModalProps {
    onLogin: OnLoginCallback;
    defaultUsername?: string;
}

const LoginModal = ({ onLogin, defaultUsername, ...rest }: Props) => {
    return (
        <ModalTwo size="small" {...rest}>
            <LoginContainer
                defaultUsername={defaultUsername}
                onLogin={onLogin}
                setupVPN={true}
                signupUrl=""
                modal
                hasRemember={false}
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
