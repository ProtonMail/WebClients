import { createActorContext } from '@xstate/react';

import type { TotpBackupCodesActorRef } from './state-machine/totpBackupCodeMachine';
import { unauthedLost2FAStateMachine } from './state-machine/unauthedLost2FAStateMachine';
import type { VerifyOwnershipWithEmailActorRef } from './state-machine/verifyOwnershipWithEmailMachine';
import type { VerifyOwnershipWithPhoneActorRef } from './state-machine/verifyOwnershipWithPhoneMachine';
import type { VerifyOwnershipWithPhraseActorRef } from './state-machine/verifyOwnershipWithPhraseMachine';

export const UnauthedLost2FAContext = createActorContext(unauthedLost2FAStateMachine);

export function useUnauthLost2FA() {
    const { useActorRef, useSelector } = UnauthedLost2FAContext;

    return {
        useUnauthLost2FAActorRef: useActorRef,
        useUnauthLost2FASelector: useSelector,
    };
}

export const useTotpBackupCodesActorRef = () => {
    const { useUnauthLost2FASelector } = useUnauthLost2FA();
    const totpBackupCodesActorRef = useUnauthLost2FASelector(
        (snapshot) => snapshot.children.totpBackupCodes as TotpBackupCodesActorRef
    );

    return totpBackupCodesActorRef;
};

export const useVerifyOwnershipWithEmailActorRef = () => {
    const { useUnauthLost2FASelector } = useUnauthLost2FA();
    const verifyOwnershipWithEmailActorRef = useUnauthLost2FASelector(
        (snapshot) => snapshot.children.verifyOwnershipWithEmail as VerifyOwnershipWithEmailActorRef
    );

    return verifyOwnershipWithEmailActorRef;
};

export const useVerifyOwnershipWithPhoneActorRef = () => {
    const { useUnauthLost2FASelector } = useUnauthLost2FA();
    const verifyOwnershipWithPhoneActorRef = useUnauthLost2FASelector(
        (snapshot) => snapshot.children.verifyOwnershipWithPhone as VerifyOwnershipWithPhoneActorRef
    );

    return verifyOwnershipWithPhoneActorRef;
};

export const useVerifyOwnershipWithPhraseActorRef = () => {
    const { useUnauthLost2FASelector } = useUnauthLost2FA();
    const verifyOwnershipWithPhraseActorRef = useUnauthLost2FASelector(
        (snapshot) => snapshot.children.verifyOwnershipWithPhrase as VerifyOwnershipWithPhraseActorRef
    );

    return verifyOwnershipWithPhraseActorRef;
};
