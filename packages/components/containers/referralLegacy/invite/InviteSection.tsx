import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import clsx from '@proton/utils/clsx';

import InviteSendEmail from './InviteSendEmail';
import InviteShareLink from './InviteShareLink';
import InviteActions from './inviteActions/InviteActions';

import './InviteSection.scss';

const BorderedBox = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={clsx([className, 'border rounded p-5'])}>{children}</div>
);

export const InviteSection = () => {
    return (
        <SettingsSectionWide>
            <div className="flex justify-space-between gap-4 mb-8 invite-section">
                <BorderedBox className="flex-1">
                    <InviteShareLink />
                </BorderedBox>
                <BorderedBox className="flex-1">
                    <InviteSendEmail />
                </BorderedBox>
            </div>
            <InviteActions />
        </SettingsSectionWide>
    );
};
