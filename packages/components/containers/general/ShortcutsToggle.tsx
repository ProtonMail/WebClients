import { c } from 'ttag';

import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

import Toggle from '../../components/toggle/Toggle';

interface Props {
    id: string;
    className?: string;
}

const ShortcutsToggle = ({ id, className, ...rest }: Props) => {
    const { update, isLoading } = useUpdateMailSetting();
    const [mailSettings] = useMailSettings();
    const state = !!mailSettings.Shortcuts;

    const handleChange = (value: number) => {
        update('Shortcuts', value, { notify: c('Success').t`Keyboard shortcuts preferences updated` });
    };

    return (
        <Toggle
            id={id}
            className={className}
            checked={state}
            onChange={({ target }) => {
                handleChange(+target.checked);
            }}
            loading={isLoading('Shortcuts')}
            {...rest}
        />
    );
};

export default ShortcutsToggle;
