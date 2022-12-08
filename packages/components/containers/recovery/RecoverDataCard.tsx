import { c } from 'ttag';

import { Button, Card } from '@proton/atoms';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { Href, Icon } from '../../components';
import { classnames } from '../../helpers/component';
import { SettingsSectionTitle } from '../account';

interface Props {
    onDismiss: () => void;
    onReactivate: () => void;
    className?: string;
}

const RecoverDataCard = ({ onDismiss, onReactivate, className }: Props) => {
    return (
        <Card rounded background={false} className={classnames(['max-w46e p2', className])}>
            <SettingsSectionTitle className="h3 flex flex-align-items-center flex-nowrap">
                <Icon className="flex-item-noshrink color-danger" name="exclamation-circle-filled" size={18} />
                <span className="ml0-5">{c('Title').t`Data locked`}</span>
            </SettingsSectionTitle>
            <p>{c('Info').t`It appears some of your data is encrypted and locked.`}</p>
            <ul>
                <li>
                    {c('Info')
                        .t`If you recently reset your password, you can use a data recovery method to unlock your data`}
                </li>
                <li>
                    {c('Info').t`If this is due to an old password reset, you can stop the message from showing again`}
                </li>
            </ul>

            <p className="mb0-5">
                <Href url={getKnowledgeBaseUrl('/recover-encrypted-messages-files')}>
                    {c('Link').t`How to unlock data`}
                </Href>
            </p>

            <Button color="norm" onClick={onReactivate} className="mr1 mt1">{c('Action').t`Unlock data`}</Button>
            <Button className="mt1" onClick={onDismiss}>{c('Action').t`Don't show again`}</Button>
        </Card>
    );
};

export default RecoverDataCard;
