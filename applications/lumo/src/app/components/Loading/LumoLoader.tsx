import type { Dispatch, PropsWithChildren, SetStateAction, SyntheticEvent } from 'react';
import { createContext, useContext, useLayoutEffect, useState } from 'react';

import { c } from 'ttag';

import TextLoader from '@proton/components/components/loader/TextLoader';
import useDocumentTitle from '@proton/components/hooks/useDocumentTitle';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LUMO_FULL_APP_TITLE } from '../../constants';
import { LazyLottie } from '../LazyLottie';

import './LumoLoader.scss';

// Lazy-load the loader animation + lottie-react so neither sits on the first-paint
// critical path. lottie-web (~298KB) was being pulled into the initial GuestApp/AuthApp
// chunk solely to render this spinner — heavy on slow networks (and invisible on mobile,
// where a native placeholder covers the web view until the app signals it is ready).
const getLoaderAnimationData = () => import('../Animations/loader.json');

const preventDefaultEvent = (e: SyntheticEvent) => e.preventDefault();

const LumoBootLoaderContext = createContext<Dispatch<SetStateAction<number>>>(() => {});

/**
 * One loader for the whole boot, wrapping the app in `AppGuard`. Every `LumoLoader` below only adds a
 * hold; this shows the loader while any hold exists. Hand-offs between loading screens remove one hold
 * and add the next in the same commit, so the animation is never remounted.
 */
export const LumoBootLoader = ({ children }: PropsWithChildren) => {
    const [holdCount, setHoldCount] = useState(0);
    const appName = LUMO_SHORT_APP_NAME;

    return (
        <LumoBootLoaderContext.Provider value={setHoldCount}>
            {holdCount > 0 && (
                <div
                    className="loader-page h-full lumo-boot-loader lumo-color-primary"
                    // Ignore drag & drop during loading to avoid issue when user drops
                    // file too soon before the app is ready causing stop of the app
                    // load and showing the file instead.
                    onDragOver={preventDefaultEvent}
                    onDragEnter={preventDefaultEvent}
                    onDragEnd={preventDefaultEvent}
                    onDrop={preventDefaultEvent}
                >
                    <div className="absolute inset-center text-center">
                        <div className="lumo-loader">
                            <LazyLottie getAnimationData={getLoaderAnimationData} loop={true} />
                        </div>
                        <TextLoader className="color-weak ml-3">{c('Info').t`Loading ${appName}`}</TextLoader>
                    </div>
                </div>
            )}
            {children}
        </LumoBootLoaderContext.Provider>
    );
};

/**
 * A phantom loading screen: renders nothing itself and keeps `LumoBootLoader` visible while mounted.
 */
const LumoLoader = () => {
    const setHoldCount = useContext(LumoBootLoaderContext);

    useDocumentTitle(LUMO_FULL_APP_TITLE);

    // A layout effect, so a hand-off lands in one commit before paint.
    useLayoutEffect(() => {
        setHoldCount((count) => count + 1);
        return () => setHoldCount((count) => count - 1);
    }, [setHoldCount]);

    return null;
};

export default LumoLoader;
