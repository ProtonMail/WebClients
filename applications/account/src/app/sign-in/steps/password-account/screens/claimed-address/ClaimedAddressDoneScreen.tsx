import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Card } from '@proton/atoms/Card/Card';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';

import Text from '../../../../../public/Text';
import type { SignInScreen, SignInScreenProps } from '../../../../routes/signInRoute';
import { useSignInProps } from '../../../../wizard/SignInProvider';
import { PasswordAccountContext } from '../../PasswordAccountContext';
import {
    selectClaimedAddressDone,
    selectClaimedEmail,
    selectSubmitting,
} from '../../state-machine/passwordAccountStateMachine';

/**
 * Where the recovered account's data now lives: the address just created, or (`migrated`) an address the account
 * already had, in which case there was nothing to create. There's no going back from either: once the address is
 * created the user is signed in, and an address the account already had means the API cleared the claim with this
 * sign-in, so this is the only notice of it.
 */
export const ClaimedAddressDoneScreen: SignInScreen = ({ onBack }: SignInScreenProps) => {
    const { layout } = useSignInProps();
    const actorRef = PasswordAccountContext.useActorRef();
    const claimedEmail = PasswordAccountContext.useSelector(selectClaimedEmail);
    const done = PasswordAccountContext.useSelector(selectClaimedAddressDone);
    const submitting = PasswordAccountContext.useSelector(selectSubmitting);

    const created = done?.variant === 'created';
    const boldClaimedEmail = <strong key="claimed">{claimedEmail}</strong>;

    return (
        <>
            <layout.Header
                title={
                    created ? c('claimed address').t`You're all set` : c('claimed address').t`Your address has changed`
                }
                onBack={onBack}
            />
            <layout.Body>
                <Text>
                    {created
                        ? c('claimed address').t`Your data was migrated to the address below and remains private.`
                        : c('claimed address')
                              .jt`The address ${boldClaimedEmail} has been claimed and can no longer be used for this account. Your data was migrated to the address below and remains private.`}
                </Text>
                <div className="text-semibold">
                    {created ? c('claimed address').t`Your new address` : c('claimed address').t`Your address`}
                </div>
                <Card
                    data-testid="claimed-address:new-address"
                    className="mt-2 mb-4 flex flex-nowrap items-center justify-space-between gap-2"
                    bordered={false}
                    rounded
                >
                    <span className="text-ellipsis">{done?.address}</span>
                    <IcCheckmarkCircleFilled className="color-success shrink-0" />
                </Card>
                <Text>
                    {created
                        ? c('claimed address')
                              .jt`Your previous username, ${boldClaimedEmail}, can no longer be used to sign in to this account.`
                        : c('claimed address').t`Your password remains the same.`}
                </Text>
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

ClaimedAddressDoneScreen.offersBack = false;
