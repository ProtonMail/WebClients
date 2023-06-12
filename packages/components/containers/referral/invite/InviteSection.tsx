import { SettingsSectionWide } from '@proton/components';
import clsx from '@proton/utils/clsx';

import InviteSendEmail from './InviteSendEmail';
import InviteShareLink from './InviteShareLink';
import InviteActions from './inviteActions/InviteActions';

import './InviteSection.scss';

const BorderedBox = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={clsx([className, 'border rounded p-5'])}>{children}</div>
);

const InviteSection = () => {
    return (
        <SettingsSectionWide>
            <div className="flex flex-justify-space-between gap-4 mb-8 invite-section">
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
