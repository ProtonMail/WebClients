import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';

import { useUserSettings } from '../../hooks';
import type { Props } from './BugModal';
import BugModal from './BugModal';

const AuthenticatedBugModal = (props: Omit<Props, 'username' | 'email'>) => {
    const [{ Name = '', Email }] = useUser();
    const [userSettings] = useUserSettings();
    const [addresses = []] = useAddresses();
    const email = Email || addresses[0]?.Email || userSettings?.Email?.Value;
    return <BugModal username={Name} email={email} {...props} />;
};

export default AuthenticatedBugModal;
