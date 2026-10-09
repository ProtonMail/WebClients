import { useState } from 'react';

import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';
import { ClaimableAddressType } from '@proton/shared/lib/keys/setupAddress';

import Text from '../../../../../public/Text';
import ClaimInternalAddressForm from '../../../../../setup-address/ClaimInternalAddressForm';
import GenerateAddressForm from '../../../../../setup-address/GenerateAddressForm';
import type { SignInScreen, SignInScreenProps } from '../../../../routes/signInRoute';
import { useSignInProps } from '../../../../wizard/SignInProvider';
import { PasswordAccountContext } from '../../PasswordAccountContext';
import {
    selectClaimedAddressGeneration,
    selectClaimedEmail,
    selectSubmitting,
} from '../../state-machine/passwordAccountStateMachine';

/**
 * The claimed address is disabled, so the recovered account needs a new address before it can be signed in to. The
 * claimed address's local part is offered as-is when it's free; otherwise, or on "Create your own", the user picks one.
 */
export const ClaimedAddressCreateScreen: SignInScreen = ({ onBack }: SignInScreenProps) => {
    const { layout } = useSignInProps();
    const actorRef = PasswordAccountContext.useActorRef();
    const claimedEmail = PasswordAccountContext.useSelector(selectClaimedEmail);
    const generation = PasswordAccountContext.useSelector(selectClaimedAddressGeneration);
    const submitting = PasswordAccountContext.useSelector(selectSubmitting);
    // Picking a username of their own instead of the one offered
    const [editing, setEditing] = useState(false);
    const [defaultUsername, setDefaultUsername] = useState('');

    const claimableAddress = generation?.claimableAddress;
    const boldClaimedEmail = <strong key="claimed">{claimedEmail}</strong>;

    const handleSubmit = (username: string, domain: string) => {
        setDefaultUsername(username);
        actorRef.send({ type: 'claimedAddress.submitted', payload: { username, domain } });
    };

    return (
        <>
            <layout.Header
                title={c('Title').t`Create your ${BRAND_NAME} address`}
                // Back from picking a username returns to the address offered
                onBack={editing && claimableAddress ? () => setEditing(false) : onBack}
            />
            <layout.Body>
                <Text data-testid="text:generate-internal-address">
                    {c('claimed address')
                        .jt`The address ${boldClaimedEmail} has been claimed and can no longer be used for this account. Your data is safe and hasn't been shared with anyone. To migrate it to a new account, create a new ${BRAND_NAME} email address.`}
                </Text>
                {!claimableAddress || editing ? (
                    <GenerateAddressForm
                        onSubmit={handleSubmit}
                        loading={submitting}
                        defaultUsername={defaultUsername}
                        availableDomains={generation?.availableDomains}
                    />
                ) : (
                    <ClaimInternalAddressForm
                        onSubmit={handleSubmit}
                        loading={submitting}
                        domain={claimableAddress.domain}
                        username={claimableAddress.username}
                        onEdit={claimableAddress.type === ClaimableAddressType.Any ? () => setEditing(true) : undefined}
                    />
                )}
            </layout.Body>
        </>
    );
};
