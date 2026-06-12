import { c } from 'ttag';

import EllipsisLoader from '@proton/components/components/loader/EllipsisLoader';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import useBeforeUnload from '@proton/components/hooks/useBeforeUnload';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';

import { LazyLottie } from '../LazyLottie';

import './MigratingModal.scss';

type ModalVariant = 'migrating' | 'completing';

const MigratingModal = ({ variant }: { variant: ModalVariant }) => {
    useBeforeUnload(true);

    const variantConfigs: Record<
        ModalVariant,
        { title: string; subtitle: string; getAnimationData: () => Promise<{ default: object }> }
    > = {
        migrating: {
            title: c('BOSS').t`Creating accounts. Going private`,
            subtitle: c('BOSS')
                .t`We’re creating your accounts and importing your data now. Every email, every event is yours alone. Visible to your team only. Not us, not anyone else.`,
            getAnimationData: () => import('../../animations/fileTransfer.json'),
        },
        completing: {
            title: c('BOSS').t`Going private`,
            subtitle: c('BOSS')
                .t`We’re switching on end-to-end encryption for everyone. Every email, every event is now yours alone. Visible to your team only. Not us, not anyone else.`,
            getAnimationData: () => import('../../animations/fileTransfer.json'),
        },
    };

    const { title, subtitle, getAnimationData } = variantConfigs[variant];

    return (
        <ModalTwo
            open
            size="small"
            className="rounded-xxl shadow-none bg-transparent"
            rootClassName="oles-migrating-modal"
        >
            <ModalTwoContent>
                <div className="text-center pt-12 pb-6">
                    <LazyLottie autoPlay getAnimationData={getAnimationData} loop={true} className="px-12" />
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
