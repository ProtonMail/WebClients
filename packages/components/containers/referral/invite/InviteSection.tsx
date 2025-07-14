import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import clsx from '@proton/utils/clsx';

import HowItWorks from '../components/HowItWorks/HowItWorks';
import InviteSendEmail from './InviteSendEmail';
import InviteShareLink from './InviteShareLink';

export const InviteSection = () => {
    const borderedBoxClasses = 'border border-weak rounded-lg p-6';
    return (
        <SettingsSectionWide className="flex gap-6 lg:flex-row flex-column-reverse flex-nowrap">
            <div className="flex flex-column gap-6 flex-auto">
                <InviteShareLink className={borderedBoxClasses} />
                <InviteSendEmail className={borderedBoxClasses} />
            </div>
            <HowItWorks className={clsx('flex-auto', borderedBoxClasses)} />
        </SettingsSectionWide>
    );
};
