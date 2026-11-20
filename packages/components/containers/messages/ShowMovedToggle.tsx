import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { SHOW_MOVED } from '@proton/shared/lib/mail/mailSettings';

import Toggle from '../../components/toggle/Toggle';

const { DRAFTS_AND_SENT, NONE } = SHOW_MOVED;

interface Props {
    id: string;
}

const ShowMovedToggle = ({ id }: Props) => {
    const { update, isLoading } = useUpdateMailSetting();
    const [mailSettings] = useMailSettings();
    const state = !!mailSettings.ShowMoved;

    const handleChange = (checked: boolean) => {
        update('ShowMoved', checked ? DRAFTS_AND_SENT : NONE);
    };

    return (
        <Toggle
            id={id}
            checked={state}
            onChange={({ target }) => handleChange(target.checked)}
            loading={isLoading('ShowMoved')}
        />
    );
};

export default ShowMovedToggle;
