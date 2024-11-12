import { c } from 'ttag';

import { useWelcomeFlags } from '@proton/account';
import { Button } from '@proton/atoms/Button/Button';

export const DrawerReplayOnboarding = () => {
    const { startReplay } = useWelcomeFlags();
    return (
        <Button onClick={startReplay} shape="outline" fullWidth>{c('Onboarding modal')
            .t`Replay introduction`}</Button>
    );
};
