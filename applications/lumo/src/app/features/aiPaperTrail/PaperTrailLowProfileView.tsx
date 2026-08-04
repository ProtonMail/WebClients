import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import lumoGhostAvatarDark from '@proton/styles/assets/img/lumo/lumo-ghost-avatar-dark.svg';
import lumoGhostAvatar from '@proton/styles/assets/img/lumo/lumo-ghost-avatar.svg';

import { useLumoTheme } from '../../providers';

interface Props {
    onStartOver: () => void;
}

export const PaperTrailLowProfileView = ({ onStartOver }: Props) => {
    const { isDarkLumoTheme } = useLumoTheme();

    return (
        <div className="ai-paper-trail__inner ai-paper-trail__low-profile flex flex-column items-center gap-4 text-center">
            <img
                src={isDarkLumoTheme ? lumoGhostAvatarDark : lumoGhostAvatar}
                alt=""
                className="ai-paper-trail__low-profile-icon shrink-0"
            />
            <h2 className="ai-paper-trail__title m-0">
                {c('collider_2025:Title').t`Looks like you've kept a low profile`}
            </h2>
            <p className="ai-paper-trail__subtitle m-0">
                {c('collider_2025:Info')
                    .t`There wasn't enough information in the data you uploaded to build a meaningful profile. Either you haven't used this AI much, or your exported data doesn't contain enough detail for us to make reliable inferences.`}
            </p>
            <Button color="norm" pill onClick={onStartOver}>
                {c('collider_2025:Action').t`Try again`}
            </Button>
        </div>
    );
};
