import { c } from 'ttag';

import { Button, Card, Href } from '@proton/atoms';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

import { Icon } from '../../components';
import { SettingsSectionTitle } from '../account';

interface Props {
    onDismiss: () => void;
    onReactivate: () => void;
    className?: string;
}

const RecoverDataCard = ({ onDismiss, onReactivate, className }: Props) => {
    return (
        <Card rounded background={false} className={clsx(['max-w46e p-7', className])}>
            <SettingsSectionTitle className="h3 flex flex-align-items-center flex-nowrap">
                <Icon className="flex-item-noshrink color-danger" name="exclamation-circle-filled" size={18} />
                <span className="ml-2">{c('Title').t`Data locked`}</span>
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

            <p className="mb-2">
                <Href href={getKnowledgeBaseUrl('/recover-encrypted-messages-files')}>
                    {c('Link').t`How to unlock data`}
                </Href>
            </p>

            <Button color="norm" onClick={onReactivate} className="mr-4 mt-4">{c('Action').t`Unlock data`}</Button>
            <Button className="mt-4" onClick={onDismiss}>{c('Action').t`Don't show again`}</Button>
        </Card>
    );
};

export default RecoverDataCard;
