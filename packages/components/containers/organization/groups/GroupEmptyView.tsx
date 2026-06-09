import { c } from 'ttag';

import groupEmptyStateImg from '@proton/styles/assets/img/account/group.svg';

const GroupEmptyView = () => (
    <div className="flex flex-column items-center justify-center h-full py-8">
        <img src={groupEmptyStateImg} alt="" className="mb-4" />
        <p className="color-weak text-center">{c('Info').t`Select a group to view its members and settings.`}</p>
    </div>
);

export default GroupEmptyView;
