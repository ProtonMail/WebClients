import { useAddresses, useUser, useUserSettings } from '../../hooks';
import BugModal, { Props } from './BugModal';

const AuthenticatedBugModal = (props: Omit<Props, 'username' | 'email'>) => {
    const [{ Name = '', Email }] = useUser();
    const [userSettings] = useUserSettings();
    const [addresses = []] = useAddresses();
    const email = Email || addresses[0]?.Email || userSettings?.Email?.Value;
    return <BugModal username={Name} email={email} {...props} />;
};

export default AuthenticatedBugModal;
