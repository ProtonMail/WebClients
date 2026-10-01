import type { SignInScreen, SignInScreenProps } from '../../../routes/signInRoute';
import { useSignInProps } from '../../../wizard/SignInProvider';
import SSODeviceRejected from '../components/SSODeviceRejected';

export const RejectedScreen: SignInScreen = ({ onBack }: SignInScreenProps) => {
    const { layout } = useSignInProps();
    return (
        <>
            {/* No title: the rejection brings its own */}
            <layout.Header onBack={onBack} />
            <layout.Body>
                <SSODeviceRejected onBack={onBack} />
            </layout.Body>
        </>
    );
};
