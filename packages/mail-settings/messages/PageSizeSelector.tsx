import type { DropdownProps } from '@proton/components/components/dropdown/Dropdown';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
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
    const { update } = useUpdateMailSetting();

    const handleChange = (value: MAIL_PAGE_SIZE) => {
        update('PageSize', value);
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
                aria-labelledby={`label-${id}`}
            >
                {PAGE_SIZE_OPTIONS.map((option) => (
                    <Option key={option.value} title={option.label} value={option.value} />
                ))}
            </SelectTwo>
        </div>
    );
};
