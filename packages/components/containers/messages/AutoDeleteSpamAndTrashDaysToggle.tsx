import Toggle from '@proton/components/components/toggle/Toggle';
import { AUTO_DELETE_SPAM_AND_TRASH_DAYS } from '@proton/shared/lib/mail/mailSettings';

interface Props {
    id?: string;
    loading?: boolean;
    autoDeleteSpamAndTrashDays?: number | null;
    onToggle: (autoDeleteSpamAndTrashDays: number) => void;
    dataTestID?: string;
}

const AutoDeleteSpamAndTrashDaysToggle = ({
    id,
    autoDeleteSpamAndTrashDays = AUTO_DELETE_SPAM_AND_TRASH_DAYS.DISABLED,
    loading,
    onToggle,
    dataTestID,
}: Props) => {
    return (
        <Toggle
            id={id}
            checked={Boolean(autoDeleteSpamAndTrashDays)}
            onChange={({ target }) =>
                onToggle(
                    target.checked ? AUTO_DELETE_SPAM_AND_TRASH_DAYS.ACTIVE : AUTO_DELETE_SPAM_AND_TRASH_DAYS.DISABLED
                )
            }
            loading={loading}
            data-testid={dataTestID}
        />
    );
};

export default AutoDeleteSpamAndTrashDaysToggle;
