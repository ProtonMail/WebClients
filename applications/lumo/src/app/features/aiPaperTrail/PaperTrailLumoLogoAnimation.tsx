import { LazyLottie } from '../../components/LazyLottie';

import '../../components/Conversation/MainContainer/LumoCatAnimation.scss';

const getLumoHomeStage1Animation = () =>
    import(
        /* webpackChunkName: "lumo-home-stage-1-animation" */
        '../../components/Animations/Home/lumo-home-stage-1.json'
    );

export const PaperTrailLumoLogoAnimation = () => (
    <div className="lumo-cat-animation ai-paper-trail__hero-animation">
        <LazyLottie
            getAnimationData={getLumoHomeStage1Animation}
            loop
            alt="Lumo"
            className="lumo-cat-animation__lottie"
        />
    </div>
);
