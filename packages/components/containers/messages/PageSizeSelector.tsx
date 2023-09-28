import { c } from 'ttag';

import { updatePageSize } from '@proton/shared/lib/api/mailSettings';
import { DEFAULT_MAIL_PAGE_SIZE } from '@proton/shared/lib/constants';
import { MailPageSize } from '@proton/shared/lib/interfaces';

import { DropdownProps, Option, SelectTwo } from '../../components';
import { useApi, useEventManager, useMailSettings, useNotifications } from '../../hooks';

interface Props {
    id?: string;
    size?: DropdownProps['size'];
}

const PAGE_SIZE_OPTIONS = [
    { label: '50', value: MailPageSize.FIFTY },
    { label: '100', value: MailPageSize.ONE_HUNDRED },
    { label: '200', value: MailPageSize.TWO_HUNDRED },
];

export const PageSizeSelector = ({ id, size }: Props) => {
    const [mailSettings] = useMailSettings();
    const { call } = useEventManager();
    const api = useApi();

    const { createNotification } = useNotifications();

    const handleChange = async (value: MailPageSize) => {
        await api(updatePageSize(value));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return (
        <div className="w-custom" style={{ '--w-custom': '5rem' }}>
            <SelectTwo
                id={id}
                data-testid="page-size-selector"
                value={mailSettings?.PageSize ?? DEFAULT_MAIL_PAGE_SIZE}
                onValue={handleChange}
                size={size}
            >
                {PAGE_SIZE_OPTIONS.map((option) => (
                    <Option key={option.value} title={option.label} value={option.value} />
                ))}
            </SelectTwo>
        </div>
    );
};
