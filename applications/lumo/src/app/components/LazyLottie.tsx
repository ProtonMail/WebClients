import { Suspense, lazy, useEffect, useRef, useState } from 'react';

import type { LottieComponentProps, LottieRef, LottieRefCurrentProps } from 'lottie-react';

const LazyLottieComponent = lazy(() => import('lottie-react'));

interface Props extends Omit<LottieComponentProps, 'animationData' | 'ref'> {
    getAnimationData: () => Promise<{ default: object }>;
    /** Hold a looping animation still. */
    paused?: boolean;
}

const isWindowActive = () => !document.hidden && document.hasFocus();

export const LazyLottie = ({ getAnimationData, paused = false, ...props }: Props) => {
    const [animationData, setAnimationData] = useState<object | null>(null);
    const [windowActive, setWindowActive] = useState(isWindowActive);
    const lottieRef = useRef<LottieRefCurrentProps | null>(null);
    // One-shot animations always finish so `onComplete` fires.
    const shouldPause = !!props.loop && (paused || !windowActive);
    const autoplay = props.autoplay !== false;

    useEffect(() => {
        const update = () => setWindowActive(isWindowActive());
        window.addEventListener('focus', update);
        window.addEventListener('blur', update);
        document.addEventListener('visibilitychange', update);
        return () => {
            window.removeEventListener('focus', update);
            window.removeEventListener('blur', update);
            document.removeEventListener('visibilitychange', update);
        };
    }, []);

    useEffect(() => {
        if (shouldPause) {
            lottieRef.current?.pause();
        } else if (autoplay) {
            lottieRef.current?.play();
        }
    }, [shouldPause, autoplay]);

    useEffect(() => {
        let cancelled = false;

        // Tear down the previous animation immediately so lottie-web stops its RAF loop
        // while the next JSON chunk loads.
        setAnimationData(null);
        lottieRef.current?.destroy();

        void (async () => {
            try {
                const result = await getAnimationData();
                if (!cancelled) {
                    setAnimationData(result.default);
                }
            } catch {
                if (!cancelled) {
                    console.error('Failed to load animation');
                }
            }
        })();

        return () => {
            cancelled = true;
            lottieRef.current?.destroy();
        };
    }, [getAnimationData]);

    const fallback = <div className={props.className} style={props.style} />;

    if (!animationData) {
        return fallback;
    }

    return (
        <Suspense fallback={fallback}>
            <LazyLottieComponent
                lottieRef={lottieRef as LottieRef}
                animationData={animationData}
                {...props}
                autoplay={autoplay && !shouldPause}
            />
        </Suspense>
    );
};
