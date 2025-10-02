import { c } from 'ttag';

import type { DropdownProps } from '@proton/components/components/dropdown/Dropdown';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { updatePageSize } from '@proton/shared/lib/api/mailSettings';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { MAIL_PAGE_SIZE } from '@proton/shared/lib/mail/mailSettings';

interface Props {
    id?: string;
    size?: DropdownProps['size'];
    loading?: boolean;
}

const PAGE_SIZE_OPTIONS = [
    { label: '50', value: MAIL_PAGE_SIZE.FIFTY },
    { label: '100', value: MAIL_PAGE_SIZE.ONE_HUNDRED },
    { label: '200', value: MAIL_PAGE_SIZE.TWO_HUNDRED },
];

export const PageSizeSelector = ({ id, size, loading }: Props) => {
    const [mailSettings] = useMailSettings();
    const dispatch = useDispatch();
    const api = useApi();

    const { createNotification } = useNotifications();

    const handleChange = async (value: MAIL_PAGE_SIZE) => {
        try {
            const { MailSettings } = await api<{ MailSettings: MailSettings }>(updatePageSize(value));
            dispatch(mailSettingsActions.updateMailSettings(MailSettings));
            createNotification({ text: c('Success').t`Preference saved` });
        } catch (err) {
            createNotification({
                text: c('Error').t`Could not save preference`,
            });
        }
    };

    return (
        <div className="w-custom" style={{ '--w-custom': '5rem' }}>
            <SelectTwo
                id={id}
                disabled={loading}
                data-testid="page-size-selector"
                value={mailSettings.PageSize}
                onValue={handleChange}
                size={size}
                aria-describedby={`label-${id}`}
            >
                {PAGE_SIZE_OPTIONS.map((option) => (
                    <Option key={option.value} title={option.label} value={option.value} />
                ))}
            </SelectTwo>
        </div>
    );
};
