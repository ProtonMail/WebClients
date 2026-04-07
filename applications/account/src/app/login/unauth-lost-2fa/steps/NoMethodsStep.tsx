import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { IcArrowWithinSquare } from '@proton/icons/icons/IcArrowWithinSquare';
import { getSupportContactURL } from '@proton/shared/lib/helpers/url';

import { useUnauthLost2FA } from '../UnauthedLost2FAContainer';

export const NoMethodsStep = () => {
    const { useUnauthLost2FAActorRef, useUnauthLost2FASelector } = useUnauthLost2FA();
    const { send } = useUnauthLost2FAActorRef();
    const username = useUnauthLost2FASelector((snapshot) => snapshot.context.username);

    return (
        <div>
            <div className="mb-4">
                {c('Info')
                    .t`Contact our Customer Support team to disable two-factor authentication for your account, or recover your account another way.`}
            </div>
            <ButtonLike
                size="large"
                fullWidth
                color="norm"
                as={Href}
                href={getSupportContactURL({ topic: 'Login and Password', product: 'account', username })}
                className="mb-2 flex justify-center items-center gap-2"
            >
                {c('Action').t`Contact Support Center`}
                <IcArrowWithinSquare />
            </ButtonLike>
            <Button size="large" fullWidth onClick={() => send({ type: 'reset password' })}>
                {c('Action').t`Recover account`}
            </Button>
        </div>
    );
};
