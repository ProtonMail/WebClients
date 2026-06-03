import { useEffect, useState } from 'react';

import Lottie, { type LottieComponentProps } from 'lottie-react';

import noop from '@proton/utils/noop';

interface Props extends Omit<LottieComponentProps, 'animationData' | 'ref'> {
    getAnimationData: () => Promise<{ default: object }>;
    fallbackClassName?: string;
    fallbackStyle?: React.CSSProperties;
}

export const LazyLottie = ({ getAnimationData, fallbackClassName, fallbackStyle, ...props }: Props) => {
    const [animationData, setAnimationData] = useState<object>();

    useEffect(() => {
        getAnimationData()
            .then(({ default: animationData }) => setAnimationData(animationData))
            .catch(noop);
    }, []);

    if (!animationData) {
        return <div className={fallbackClassName} style={fallbackStyle} />;
    }

    return <Lottie animationData={animationData} {...props} />;
};
