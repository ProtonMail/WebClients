import { useState } from 'react';

import { c } from 'ttag';

import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';

import { useLumoDispatch, useLumoSelector } from '../redux/hooks';
import { selectMasterKeyState } from '../redux/selectors';
import { retryLumoCritical } from '../util/lumoBootstrap';

/**
 * Reports a failed master key load.
 *
 * The key is now resolved after first paint, so by the time a failure is known the user may
 * already have started a conversation. That conversation is real and usable — it has its own
 * locally generated space key — but it cannot be written to IndexedDB or pushed to the server
 * without the master key, so it will not survive a reload. This banner is the only signal the user
 * gets, which is why it is not dismissible.
 *
 * `ineligible` is deliberately not handled here: it is a normal state with its own product UI, not
 * a failure.
 */
export const MasterKeyBanner = () => {
    const masterKeyState = useLumoSelector(selectMasterKeyState);
    const dispatch = useLumoDispatch();
    const [isRetrying, setIsRetrying] = useState(false);

    if (masterKeyState.status !== 'failed') {
        return null;
    }

    const handleRetry = async () => {
        setIsRetrying(true);
        try {
            await dispatch(retryLumoCritical());
        } finally {
            setIsRetrying(false);
        }
    };

    return (
        <Banner
            variant={BannerVariants.DANGER}
            className="mx-4 mt-2"
            action={
                <Button size="small" shape="underline" loading={isRetrying} onClick={handleRetry}>
                    {c('collider_2025: Action').t`Retry`}
                </Button>
            }
        >
            {c('collider_2025: Error')
                .t`Your chats can't be saved right now. Anything you write will be lost if you reload the page.`}
        </Banner>
    );
};

export default MasterKeyBanner;
