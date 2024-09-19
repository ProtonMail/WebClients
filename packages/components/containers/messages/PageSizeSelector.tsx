import { c } from 'ttag';

import type { DropdownProps } from '@proton/components/components/dropdown/Dropdown';
import Option from '@proton/components/components/option/Option';
import { updatePageSize } from '@proton/shared/lib/api/mailSettings';
import { DEFAULT_MAIL_PAGE_SIZE } from '@proton/shared/lib/constants';
import { MAIL_PAGE_SIZE } from '@proton/shared/lib/mail/mailSettings';

import { SelectTwo } from '../../components';
import { useApi, useEventManager, useMailSettings, useNotifications } from '../../hooks';

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
    const { call } = useEventManager();
    const api = useApi();

    const { createNotification } = useNotifications();

    const handleChange = async (value: MAIL_PAGE_SIZE) => {
        try {
            await api(updatePageSize(value));
            await call();
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
                value={mailSettings?.PageSize ?? DEFAULT_MAIL_PAGE_SIZE}
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
