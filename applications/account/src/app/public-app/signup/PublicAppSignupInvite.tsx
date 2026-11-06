import { useHistory } from 'react-router-dom';

import AccountLoaderPage from '../../AccountLoaderPage';
import { getSanitizedLocationDescriptorObject } from '../actions/getSanitizedLocationDescriptorObject';
import { PublicAppContext } from '../state-machine/PublicAppContext';
import { selectClientType, selectPaths } from '../state-machine/publicAppStateMachine';
import SignupInviteContainer from './SignupInviteContainer';

const PublicAppSignupInvite = () => {
    const history = useHistory();
    const signupPath = PublicAppContext.useSelector((state) => selectPaths(state).signup);
    const clientType = PublicAppContext.useSelector(selectClientType);

    return (
        <SignupInviteContainer
            loader={<AccountLoaderPage />}
            clientType={clientType}
            onValid={(inviteData) =>
                history.replace(
                    getSanitizedLocationDescriptorObject({
                        pathname: signupPath,
                        search: '?mode=sps',
                        state: { invite: inviteData },
                    })
                )
            }
            onInvalid={() => history.push(signupPath)}
        />
    );
};

export default PublicAppSignupInvite;
