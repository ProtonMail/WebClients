import { LazyLottie } from '../../LazyLottie';

import './LumoCatAnimation.scss';

const getLumoCatHomeAnimation = () =>
    import(
        /* webpackChunkName: "lumo-cat-home-animation" */
        '../../../features/themes/assets/default/newCat.json'
    );

interface LumoCatAnimationProps {
    isGhostMode: boolean;
}

const LumoCatAnimation = ({ isGhostMode }: LumoCatAnimationProps) => {
    if (isGhostMode) {
        return null;
    }

    return (
        <div className="lumo-cat-animation shrink-0 text-center">
            <LazyLottie
                alt="Lumo"
                getAnimationData={getLumoCatHomeAnimation}
                loop={true}
                className="lumo-cat-animation__lottie"
            />
        </div>
    );
};

export default LumoCatAnimation;
