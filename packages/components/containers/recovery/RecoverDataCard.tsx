import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import SettingsSectionTitle from '@proton/components/containers/account/SettingsSectionTitle';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

interface Props {
    onDismiss: () => void;
    onReactivate: () => void;
    className?: string;
}

const RecoverDataCard = ({ onDismiss, onReactivate, className }: Props) => {
    return (
        <div className={clsx('rounded border p-8 max-w-custom', className)} style={{ '--max-w-custom': '46em' }}>
            <SettingsSectionTitle className="h3 flex items-center flex-nowrap">
                <Icon className="shrink-0 color-danger" name="exclamation-circle-filled" size={4.5} />
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
        </div>
    );
};

export default RecoverDataCard;
