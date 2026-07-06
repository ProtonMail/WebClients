import { useCallback, useEffect, useRef, useState } from 'react';

import clsx from '@proton/utils/clsx';
import { c } from 'ttag';

import { LazyLottie } from '../../LazyLottie';
import { getPersistedLumoCatHomeStage, persistLumoCatHomeStage } from '../../../util/lumoCatHomeStageStorage';

import LumoCatHoverHintArrow from './LumoCatHoverHintArrow';
import './LumoCatAnimation.scss';
import {LUMO_SHORT_APP_NAME} from "@proton/shared/lib/constants";

const LOTTIE_CLASS = 'lumo-cat-animation__lottie';
const GHOST_ANIMATION_LAST_FRAME = 119;

const getLumoHomeStage1Animation = () =>
    import(
        /* webpackChunkName: "lumo-home-stage-1-animation" */
        '../../Animations/Home/lumo-home-stage-1.json'
    );

const getLumoHomeStage2Animation = () =>
    import(
        /* webpackChunkName: "lumo-home-stage-2-animation" */
        '../../Animations/Home/lumo-home-stage-2.json'
    );

const getLumoHomeStage3Animation = () =>
    import(
        /* webpackChunkName: "lumo-home-stage-3-animation" */
        '../../Animations/Home/lumo-home-stage-3.json'
    );

const getLumoHomeStage4Animation = () =>
    import(
        /* webpackChunkName: "lumo-home-stage-4-animation" */
        '../../Animations/Home/lumo-home-stage-4.json'
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

type HomeStage = 'inside-stable' | 'get-out' | 'outside-stable' | 'back-in';
type GhostAnimationKind = 'ghost-activated' | 'ghost-deactivated';

interface LumoCatAnimationProps {
    isGhostMode: boolean;
}

const LumoCatAnimation = ({ isGhostMode }: LumoCatAnimationProps) => {
    const [homeStage, setHomeStage] = useState<HomeStage>(() => getPersistedLumoCatHomeStage());
    const [ghostAnimationKind, setGhostAnimationKind] = useState<GhostAnimationKind | null>(() =>
        isGhostMode ? 'ghost-activated' : null
    );
    const [playGhostActivated, setPlayGhostActivated] = useState(false);
    const isInitialMount = useRef(true);

    const isShowingGhostAnimation = isGhostMode || ghostAnimationKind !== null;
    const isTransitioning = homeStage === 'get-out' || homeStage === 'back-in';
    const isClickable = !isShowingGhostAnimation && !isTransitioning;
    const isOutsideStable = homeStage === 'outside-stable';

    const hoverHintText = isOutsideStable
        ? c('collider_2025: Action').t`click to hide me`
        : c('collider_2025: Action').t`click to let me out`;

    const ariaLabel = isOutsideStable
        ? c('collider_2025: Action').t`Collapse ${LUMO_SHORT_APP_NAME}`
        : c('collider_2025: Action').t`Let ${LUMO_SHORT_APP_NAME} out`;

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        if (isGhostMode && ghostAnimationKind === null) {
            setGhostAnimationKind('ghost-activated');
            setPlayGhostActivated(true);
            if (isTransitioning) {
                setHomeStage('inside-stable');
                persistLumoCatHomeStage('inside-stable');
            }
        } else if (isGhostMode && ghostAnimationKind === 'ghost-deactivated') {
            setGhostAnimationKind('ghost-activated');
            setPlayGhostActivated(true);
        } else if (!isGhostMode && ghostAnimationKind === 'ghost-activated') {
            setGhostAnimationKind('ghost-deactivated');
            setPlayGhostActivated(false);
        }
    }, [isGhostMode, ghostAnimationKind, isTransitioning]);

    const handleGhostDeactivatedComplete = useCallback(() => {
        setGhostAnimationKind(null);
        setHomeStage('inside-stable');
        persistLumoCatHomeStage('inside-stable');
    }, []);

    const handleGetOutComplete = useCallback(() => {
        setHomeStage('outside-stable');
        persistLumoCatHomeStage('outside-stable');
    }, []);

    const handleBackInComplete = useCallback(() => {
        setHomeStage('inside-stable');
        persistLumoCatHomeStage('inside-stable');
    }, []);

    const handleClick = useCallback(() => {
        if (!isClickable) {
            return;
        }

        if (homeStage === 'inside-stable') {
            setHomeStage('get-out');
        } else if (homeStage === 'outside-stable') {
            setHomeStage('back-in');
        }
    }, [homeStage, isClickable]);

    const renderAnimation = () => {
        if (isShowingGhostAnimation) {
            if (ghostAnimationKind === 'ghost-activated') {
                return (
                    <LazyLottie
                        key="ghost-activated"
                        alt=""
                        getAnimationData={getLumoGhostActivatedAnimation}
                        loop={false}
                        autoplay={playGhostActivated}
                        initialSegment={
                            playGhostActivated
                                ? undefined
                                : [GHOST_ANIMATION_LAST_FRAME, GHOST_ANIMATION_LAST_FRAME]
                        }
                        className={LOTTIE_CLASS}
                    />
                );
            }

            return (
                <LazyLottie
                    key="ghost-deactivated"
                    alt=""
                    getAnimationData={getLumoGhostDeactivatedAnimation}
                    loop={false}
                    onComplete={handleGhostDeactivatedComplete}
                    className={LOTTIE_CLASS}
                />
            );
        }

        if (homeStage === 'inside-stable') {
            return (
                <LazyLottie
                    key="home-stage-1"
                    alt="Lumo"
                    getAnimationData={getLumoHomeStage1Animation}
                    loop
                    className={LOTTIE_CLASS}
                />
            );
        }

        if (homeStage === 'get-out') {
            return (
                <LazyLottie
                    key="home-stage-2"
                    alt=""
                    getAnimationData={getLumoHomeStage2Animation}
                    loop={false}
                    onComplete={handleGetOutComplete}
                    className={LOTTIE_CLASS}
                />
            );
        }

        if (homeStage === 'outside-stable') {
            return (
                <LazyLottie
                    key="home-stage-3"
                    alt="Lumo"
                    getAnimationData={getLumoHomeStage3Animation}
                    loop
                    className={LOTTIE_CLASS}
                />
            );
        }

        return (
            <LazyLottie
                key="home-stage-4"
                alt=""
                getAnimationData={getLumoHomeStage4Animation}
                loop={false}
                onComplete={handleBackInComplete}
                className={LOTTIE_CLASS}
            />
        );
    };

    return (
        <div
            className={clsx('lumo-cat-animation text-center', isClickable && 'lumo-cat-animation--clickable')}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            aria-label={isClickable ? ariaLabel : undefined}
            onClick={isClickable ? handleClick : undefined}
            onKeyDown={
                isClickable
                    ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              handleClick();
                          }
                      }
                    : undefined
            }
        >
            {renderAnimation()}
            {isClickable ? (
                <div
                    className={clsx(
                        'lumo-cat-animation__hint',
                        isOutsideStable && 'lumo-cat-animation__hint--outside'
                    )}
                    aria-hidden="true"
                >
                    <p className="lumo-cat-animation__hint-text">{hoverHintText}</p>
                    <LumoCatHoverHintArrow className="lumo-cat-animation__hint-arrow" />
                </div>
            ) : null}
        </div>
    );
};

export default LumoCatAnimation;
