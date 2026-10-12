import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import Text from '../../../../../public/Text';
import type { SignInScreen, SignInScreenProps } from '../../../../routes/signInRoute';
import { useSignInProps } from '../../../../wizard/SignInProvider';
import { PasswordAccountContext } from '../../PasswordAccountContext';
import { selectClaimedEmail, selectSubmitting } from '../../state-machine/passwordAccountStateMachine';

/**
 * An organization member whose only address was claimed: it can't create one, as its organization manages its
 * addresses, so it learns its administrator can give it a new one, and signs in without one.
 */
export const ClaimedAddressManagedScreen: SignInScreen = ({ onBack }: SignInScreenProps) => {
    const { layout } = useSignInProps();
    const actorRef = PasswordAccountContext.useActorRef();
    const claimedEmail = PasswordAccountContext.useSelector(selectClaimedEmail);
    const submitting = PasswordAccountContext.useSelector(selectSubmitting);

    const boldClaimedEmail = <strong key="claimed">{claimedEmail}</strong>;

    return (
        <>
            <layout.Header title={c('claimed address').t`Your address has been claimed`} onBack={onBack} />
            <layout.Body>
                <Text>
                    {c('claimed address')
                        .jt`The address ${boldClaimedEmail} has been claimed by another organization and can no longer be used for this account. Your data is safe and remains private.`}
                </Text>
                <Text>{c('claimed address').t`Your administrator can give you a new address.`}</Text>
                <Button
                    size="large"
                    color="norm"
                    fullWidth
                    loading={submitting}
                    onClick={() => actorRef.send({ type: 'claimedAddress.continued' })}
                    data-testid="claimed-address:continue"
                >
                    {c('Action').t`Continue`}
                </Button>
            </layout.Body>
        </>
    );
};

ClaimedAddressManagedScreen.offersBack = true;
