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
                <span className="ml0-5">{c('Title').t`Data locked`}</span>
            </SettingsSectionTitle>
            <p>{c('Info').t`Your data is encrypted and locked. You can recover access with a data recovery method.`}</p>
            <ReactivateKeysButton>{c('Action').t`Unlock data`}</ReactivateKeysButton>
        </Card>
    );
};

export default RecoverDataCard;
