import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { FeatureCode, useFeature } from '@proton/features';
import illustration from '@proton/styles/assets/img/illustrations/light-labelling-feature-modal.svg';

import SettingsLink from '../../../components/link/SettingsLink';
import type { ModalProps } from '../../../components/modalTwo/Modal';
import ModalTwo from '../../../components/modalTwo/Modal';
import ModalTwoContent from '../../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../../components/modalTwo/ModalFooter';

interface Props extends ModalProps {}

const LightLabellingFeatureModal = ({ open, ...rest }: Props) => {
    const { feature, update } = useFeature(FeatureCode.SeenLightLabellingFeatureModal);

    const handleClick = () => {
        if (feature?.Value === false) {
            void update(true);
        }
        rest.onClose?.();
    };

    return (
        <ModalTwo open={open} size="small" {...rest} disableCloseOnEscape>
            <ModalTwoContent className="mt-6 text-center">
                <img src={illustration} alt="" className="w-full" width={344} height={198} />
                <h1 className="h2 text-bold mt-4">{c('Title').t`Add a custom logo`}</h1>
                <p className="text-lg mt-2 color-weak">{c('Info')
                    .t`Boost your organization’s brand identity and create a more consistent online experience for your users.`}</p>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={handleClick}>{c('Action').t`Later`}</Button>
                <ButtonLike
                    color="norm"
                    shape="solid"
                    onClick={handleClick}
                    as={SettingsLink}
                    path="/organization-keys#organization"
                >
                    {c('Action').t`Go to settings`}
                </ButtonLike>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default LightLabellingFeatureModal;
