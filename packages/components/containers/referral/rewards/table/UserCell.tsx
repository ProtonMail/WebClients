import { c } from 'ttag';



import { Icon, classnames } from '@proton/components';
import { Referral } from '@proton/shared/lib/interfaces';


interface Props {
    referral: Referral;
}

const UserCell = ({ referral }: Props) => (
    <div className="flex flex-nowrap flex-align-items-center">
        <span className="flex-item-noshrink mr-4 no-mobile">
            <Icon name={referral.Email ? 'envelope' : 'link'} />
        </span>

        <span className={classnames([referral.Email && 'text-ellipsis'])} title={referral.Email || undefined}>
            {referral.Email ? referral.Email : c('Info').t`Public link invite`}
        </span>
    </div>
);

export default UserCell;