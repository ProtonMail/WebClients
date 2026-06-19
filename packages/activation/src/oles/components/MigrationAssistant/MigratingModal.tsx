import { c } from 'ttag';

import EllipsisLoader from '@proton/components/components/loader/EllipsisLoader';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import useBeforeUnload from '@proton/components/hooks/useBeforeUnload';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { MotionModeSetting } from '@proton/shared/lib/themes/constants';

import { LazyLottie } from '../LazyLottie';

import './MigratingModal.scss';

type ModalVariant = 'migrating' | 'completing';

const MigratingModal = ({ variant }: { variant: ModalVariant }) => {
    const { information } = useTheme();
    const animationsEnabled = information.motionMode !== MotionModeSetting.Reduce && !information.features.animations;

    useBeforeUnload(true);

    const variantConfigs: Record<
        ModalVariant,
        {
            title: string;
            subtitle: string;
            getAnimationData: () => Promise<{ default: object }>;
            initialSegment: [number, number] | undefined;
        }
    > = {
        migrating: {
            title: c('BOSS').t`Creating accounts`,
            subtitle: c('BOSS')
                .t`We’re creating your accounts and importing your data now so your team has everything they need when they start using their secure ${BRAND_NAME} account.`,
            getAnimationData: () => import('../../animations/creatingAccounts.json'),
            initialSegment: animationsEnabled ? undefined : [28, 28],
        },
        completing: {
            title: c('BOSS').t`Going private`,
            subtitle: c('BOSS')
                .t`We’re switching on end-to-end encryption for everyone. Every email, every event is now yours alone. Visible to your team only. Not us, not anyone else.`,
            getAnimationData: () => import('../../animations/goingPrivate.json'),
            initialSegment: animationsEnabled ? undefined : [28, 28],
        },
    };

    const { title, subtitle, getAnimationData, initialSegment } = variantConfigs[variant];

    return (
        <ModalTwo
            open
            size="small"
            className="rounded-xxl shadow-none bg-transparent"
            rootClassName="oles-migrating-modal"
        >
            <ModalTwoContent className="mx-2">
                <div className="text-center pt-12 pb-6">
                    <LazyLottie
                        getAnimationData={getAnimationData}
                        autoPlay={animationsEnabled}
                        loop={animationsEnabled}
                        initialSegment={initialSegment}
                        className="px-12"
                    />
                    <h2 className="text-center text-lg text-semibold mt-6 mb-4">
                        {title}
                        <EllipsisLoader />
                    </h2>
                    <p className="m-0 color-weak">{subtitle}</p>
                    <p className="color-danger flex items-center justify-center gap-2">
                        <IcInfoCircle />
                        {c('BOSS').t`Please don’t close or refresh this window.`}
                    </p>
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default MigratingModal;
