import { ModalProps, ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components/components';
import { OnLoginCallback } from '@proton/components/containers';

import { Paths } from '../content/helper';
import LoginContainer from '../login/LoginContainer';

interface Props extends ModalProps {
    onLogin: OnLoginCallback;
    defaultUsername?: string;
    paths: Paths;
}

const LoginModal = ({ paths, onLogin, defaultUsername, ...rest }: Props) => {
    return (
        <ModalTwo size="small" {...rest}>
            <LoginContainer
                metaTags={null}
                defaultUsername={defaultUsername}
                onLogin={onLogin}
                setupVPN={true}
                paths={paths}
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
