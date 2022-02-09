import { c } from 'ttag';

import { classnames } from '../../helpers/component';
import { Card, Icon, LearnMore } from '../../components';
import { SettingsSectionTitle } from '../account';
import ReactivateKeysButton from '../keys/reactivateKeys/ReactivateKeysButton';

interface Props {
    className?: string;
}

const RecoverDataCard = ({ className }: Props) => {
    return (
        <Card rounded background={false} className={classnames(['max-w52e p2', className])}>
            <SettingsSectionTitle className="h3 flex flex-align-items-center flex-nowrap">
                <Icon className="flex-item-noshrink color-danger" name="circle-exclamation-filled" size={18} />
                <span className="ml0-5">{c('Title').t`Data locked`}</span>
            </SettingsSectionTitle>
            <p>
                {c('Info')
                    .t`It appears some of your data is encrypted and locked. This is probably due to a recent or previous password reset. We suggest you use a data recovery method to unlock your data.`}
                <br />
                <LearnMore url="https://protonmail.com/support/knowledge-base/recover-encrypted-messages-files" />
            </p>
            <ReactivateKeysButton>{c('Action').t`Unlock data`}</ReactivateKeysButton>
        </Card>
    );
};

export default RecoverDataCard;
