import Toggle from '@proton/components/components/toggle/Toggle';
import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';

interface Props {
    id: string;
    showAlmostAllMail: number;
}

const AlmostAllMailToggle = ({ id, showAlmostAllMail }: Props) => {
    const { update, isLoading } = useUpdateMailSetting();
    const state = Boolean(showAlmostAllMail);

    const handleChange = (checked: boolean) => {
        const bit = +checked;
        update('AlmostAllMail', bit);
    };

    return (
        <Toggle
            id={id}
            checked={state}
            onChange={({ target }) => handleChange(target.checked)}
            loading={isLoading('AlmostAllMail')}
        />
    );
};

export default AlmostAllMailToggle;
