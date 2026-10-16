import { c } from 'ttag';

import ProtonLogo from '@proton/components/components/logo/ProtonLogo';
import { BRAND_NAME, SPACES_APP_NAME } from '@proton/shared/lib/constants';

interface Props {
    inviter: string;
    spaceName?: string;
    spaceDescription?: string;
}

const InvitePanel = ({ inviter, spaceName, spaceDescription }: Props) => {
    const name = spaceName || c('chat_2025: Spaces').t`${BRAND_NAME} Space`;

    return (
        <div className="relative flex flex-column gap-10 h-full">
            <div className="spaces-invite-pill relative flex items-center justify-center w-full gap-1">
                <span className="text-semibold text-ellipsis" title={inviter}>
                    {inviter}
                </span>
                <span className="color-weak shrink-0">{c('chat_2025: Spaces').t`invited you to join this space`}</span>
            </div>

            <div className="relative flex flex-column gap-4">
                <div
                    className="spaces-invite-avatar flex items-center justify-center user-select-none"
                    aria-hidden="true"
                >
                    <ProtonLogo variant="glyph-only" scale={1.5} />
                </div>

                <div>
                    <h2 className="text-semibold text-4xl lh130 mb-1 text-break">{name}</h2>
                    <p className="spaces-text-md m-0 color-weak text-normal">
                        {c('chat_2025: Spaces').t`Community on ${SPACES_APP_NAME}`}
                    </p>
                    {spaceDescription && (
                        <p className="spaces-text-md mt-4 mb-0 color-weak text-normal text-break">{spaceDescription}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InvitePanel;
