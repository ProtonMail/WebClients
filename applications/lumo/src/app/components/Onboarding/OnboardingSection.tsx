import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { Icon } from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import lumoShield from '@proton/styles/assets/img/lumo/discussion-locks.svg';
import locks from '@proton/styles/assets/img/lumo/lock-closed.svg';
import shieldCheck from '@proton/styles/assets/img/lumo/shield-check.svg';

interface OnboardingSectionProps {
    onClick: () => void;
    onClose: () => void;
}

const OnboardingSection = ({ onClick, onClose }: OnboardingSectionProps) => {
    const lumoCharacteristics = [
        {
            title: c('collider_2025: Characteristic Title').t`Private`,
            characteristic: c('collider_2025: Characteristic')
                .t`Unlike other assistants, I don't record our conversations.`,
            img: lumoShield,
        },
        {
            title: c('collider_2025: Characteristic Title').t`Safeguarded`,
            characteristic: c('collider_2025: Characteristic').t`Not even ${BRAND_NAME} can access our chat history.`,
            img: locks,
        },
        {
            title: c('collider_2025: Characteristic Title').t`Treated with respect`,
            characteristic: c('collider_2025: Characteristic').t`Our conversations are never used for training.`,
            img: shieldCheck,
        },
    ];

    return (
        <div className="flex flex-column flex-nowrap gap-4 mt-6 bg-norm p-2 rounded-xl pb-8 border border-weak mx-8">
            <div className="flex flex-row flex-nowrap justify-space-between items-center ml-2">
                <h2 className="text-rg text-semibold">{c('collider_2025:Title').t`Whatever you ask me is:`}</h2>
                <div className="flex flex-row flex-nowrap gap-2 items-center">
                    <InlineLinkButton onClick={onClick} className="text-no-decoration text-semibold">{c(
                        'collider_2025: Button'
                    ).t`Learn more`}</InlineLinkButton>
                    <Button size="small" icon shape="ghost" onClick={onClose}>
                        <Icon name="cross" size={5} alt={c('collider_2025: Action').t`Dismiss`} />
                    </Button>
                </div>
            </div>
            <div className="flex flex-row flex-nowrap gap-2 mx-4">
                {lumoCharacteristics.map((characteristic) => (
                    <div key={characteristic.title} className="flex-1 flex flex-column gap-2 flex-nowrap">
                        <div className="min-h-custom flex" style={{ '--min-h-custom': '43px' }}>
                            <img className="shrink-0 my-auto" src={characteristic.img} alt="" />
                        </div>
                        <p className="m-0 text-semibold">{characteristic.title}</p>
                        <p className="m-0 color-weak">{characteristic.characteristic}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OnboardingSection;
