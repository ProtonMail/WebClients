import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';

import Toggle from '../../components/toggle/Toggle';

interface Props {
    id: string;
    confirmLink: number;
}

const RequestLinkConfirmationToggle = ({ id, confirmLink }: Props) => {
    const { update, isLoading } = useUpdateMailSetting();
    const state = !!confirmLink;

    const handleChange = (checked: boolean) => {
        update('ConfirmLink', +checked);
    };

    return (
        <Toggle
            id={id}
            checked={state}
            onChange={({ target }) => handleChange(target.checked)}
            loading={isLoading('ConfirmLink')}
        />
    );
};

export default RequestLinkConfirmationToggle;
