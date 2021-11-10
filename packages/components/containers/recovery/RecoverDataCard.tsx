import { c } from 'ttag';
import { classnames } from '../../helpers/component';
import { Card, Icon } from '../../components';
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
                <span className="ml0-5">{c('Title').t`Encrypted data`}</span>
            </SettingsSectionTitle>
            <p>{c('Info').t`Your data is encrypted, you can recover your data by reactivating your keys.`}</p>
            <ReactivateKeysButton>{c('Action').t`Recover data`}</ReactivateKeysButton>
        </Card>
    );
};

export default RecoverDataCard;
