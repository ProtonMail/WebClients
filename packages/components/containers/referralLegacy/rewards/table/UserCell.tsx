import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import type { Referral } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

interface Props {
    referral: Referral;
}

const UserCell = ({ referral }: Props) => (
    <div className="flex flex-nowrap items-center">
        <span className="hidden md:flex shrink-0 mr-4">
            <Icon name={referral.Email ? 'envelope' : 'link'} />
        </span>

        <span className={clsx([referral.Email && 'text-ellipsis'])} title={referral.Email || undefined}>
            {referral.Email ? referral.Email : c('Info').t`Public link invite`}
        </span>
    </div>
);

export default UserCell;
