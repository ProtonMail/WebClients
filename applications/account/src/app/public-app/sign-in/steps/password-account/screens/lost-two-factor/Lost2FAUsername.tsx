import { UserNameWithIcon } from '../../../../../components/username/UserNameWithIcon';
import { Lost2FAContext } from './Lost2FAContext';
import { selectLost2FAUsername } from './state-machine/lost2FAStateMachine';

/** The account's username, which the lost-2FA screens show under their title. */
export const Lost2FAUsername = () => {
    const username = Lost2FAContext.useSelector(selectLost2FAUsername);
    return <UserNameWithIcon username={username} />;
};
