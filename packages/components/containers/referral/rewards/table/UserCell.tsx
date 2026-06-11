import { c } from 'ttag';

import { IcEnvelope } from '@proton/icons/icons/IcEnvelope';
import { IcLink } from '@proton/icons/icons/IcLink';
import type { Referral } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

interface Props {
    referral: Referral;
}

const UserCell = ({ referral }: Props) => (
    <div className="flex flex-nowrap items-center">
        <span className="hidden md:flex shrink-0 mr-4">{referral.Email ? <IcEnvelope /> : <IcLink />}</span>

        <span className={clsx([referral.Email && 'text-ellipsis'])} title={referral.Email || undefined}>
            {referral.Email ? referral.Email : c('Info').t`Public link invite`}
        </span>
    </div>
);

export default UserCell;
