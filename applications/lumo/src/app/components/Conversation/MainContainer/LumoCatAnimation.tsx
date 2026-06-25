import { useCallback, useEffect, useRef, useState } from 'react';

import { LazyLottie } from '../../LazyLottie';

import './LumoCatAnimation.scss';

const GHOST_ANIMATION_LAST_FRAME = 94;

const getLumoCatHomeAnimation = () =>
    import(
        /* webpackChunkName: "lumo-cat-home-animation" */
        '../../../features/themes/assets/default/newCat.json'
    );

const getLumoGhostActivatedAnimation = () =>
    import(
        /* webpackChunkName: "lumo-ghost-activated-animation" */
        '../../Animations/lumo-ghost-activated.json'
    );

const getLumoGhostDeactivatedAnimation = () =>
    import(
        /* webpackChunkName: "lumo-ghost-deactivated-animation" */
        '../../Animations/lumo-ghost-deactivated.json'
    );

type AnimationKind = 'normal' | 'ghost-activated' | 'ghost-deactivated';

interface LumoCatAnimationProps {
    isGhostMode: boolean;
}

const LumoCatAnimation = ({ isGhostMode }: LumoCatAnimationProps) => {
    const [animationKind, setAnimationKind] = useState<AnimationKind>(() =>
        isGhostMode ? 'ghost-activated' : 'normal'
    );
    const [playGhostActivated, setPlayGhostActivated] = useState(false);
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        if (isGhostMode && animationKind === 'normal') {
            setAnimationKind('ghost-activated');
            setPlayGhostActivated(true);
        } else if (isGhostMode && animationKind === 'ghost-deactivated') {
            setAnimationKind('ghost-activated');
            setPlayGhostActivated(true);
        } else if (!isGhostMode && animationKind === 'ghost-activated') {
            setAnimationKind('ghost-deactivated');
        }
    }, [isGhostMode, animationKind]);

    const handleGhostDeactivatedComplete = useCallback(() => {
        setAnimationKind('normal');
    }, []);

    const renderLottie = () => {
        if (animationKind === 'normal') {
            return (
                <LazyLottie
                    alt="Lumo"
                    getAnimationData={getLumoCatHomeAnimation}
                    loop
                    className="lumo-cat-animation__lottie"
                />
            );
        }

        if (animationKind === 'ghost-activated') {
            return (
                <LazyLottie
                    key="ghost-activated"
                    alt="Lumo"
                    getAnimationData={getLumoGhostActivatedAnimation}
                    loop={false}
                    autoplay={playGhostActivated}
                    initialSegment={
                        playGhostActivated ? undefined : [GHOST_ANIMATION_LAST_FRAME, GHOST_ANIMATION_LAST_FRAME]
                    }
                    className="lumo-cat-animation__lottie"
                />
            );
        }

        return (
            <LazyLottie
                key="ghost-deactivated"
                alt="Lumo"
                getAnimationData={getLumoGhostDeactivatedAnimation}
                loop={false}
                onComplete={handleGhostDeactivatedComplete}
                className="lumo-cat-animation__lottie"
            />
        );
    };

    return <div className="lumo-cat-animation shrink-0 text-center">{renderLottie()}</div>;
};

export default LumoCatAnimation;
