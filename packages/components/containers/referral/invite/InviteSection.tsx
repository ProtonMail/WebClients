import { classnames, SettingsSectionWide } from '@proton/components';

import InviteActions from './inviteActions/InviteActions';
import InviteSendEmail from './InviteSendEmail';
import InviteShareLink from './InviteShareLink';

import './InviteSection.scss';

const BorderedBox = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={classnames([className, 'border rounded-lg p1-5'])}>{children}</div>
);

const InviteSection = () => {
    return (
        <SettingsSectionWide>
            <div className="flex flex-justify-space-between flex-gap-1 mb2 invite-section">
                <BorderedBox className="flex-item-fluid">
                    <InviteShareLink />
                </BorderedBox>
                <BorderedBox className="flex-item-fluid">
                    <InviteSendEmail />
                </BorderedBox>
            </div>
            <InviteActions />
        </SettingsSectionWide>
    );
};

export default InviteSection;
