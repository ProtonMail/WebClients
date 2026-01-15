import { Suspense, lazy, useEffect, useState } from 'react';

import type { LottieComponentProps } from 'lottie-react';

const LazyLottieComponent = lazy(() => import('lottie-react'));

interface Props extends Omit<LottieComponentProps, 'animationData' | 'ref'> {
    getAnimationData: () => Promise<{ default: object }>;
}

export const LazyLottie = ({ getAnimationData, ...props }: Props) => {
    const [animationData, setAnimationData] = useState<object | null>(null);

    useEffect(() => {
        void (async () => {
            try {
                const result = await getAnimationData();
                setAnimationData(result.default);
            } catch {
                console.error('Failed to load animation');
            }
        })();
    }, []);

    const fallback = <div className={props.className} style={props.style} />;

    if (!animationData) {
        return fallback;
    }

    return (
        <Suspense fallback={fallback}>
            <LazyLottieComponent animationData={animationData} {...props} />
        </Suspense>
    );
};
