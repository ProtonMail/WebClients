import { Suspense, lazy, useEffect, useRef, useState } from 'react';

import type { LottieComponentProps, LottieRef, LottieRefCurrentProps } from 'lottie-react';

const LazyLottieComponent = lazy(() => import('lottie-react'));

interface Props extends Omit<LottieComponentProps, 'animationData' | 'ref'> {
    getAnimationData: () => Promise<{ default: object }>;
}

export const LazyLottie = ({ getAnimationData, ...props }: Props) => {
    const [animationData, setAnimationData] = useState<object | null>(null);
    const lottieRef = useRef<LottieRefCurrentProps | null>(null);

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
            <LazyLottieComponent lottieRef={lottieRef as LottieRef} animationData={animationData} {...props} />
        </Suspense>
    );
};
