import { c } from 'ttag';
import { Button, Icon, InputFieldTwo } from '@proton/components';
import { ChangeEventHandler, MouseEventHandler, ReactNode } from 'react';

interface Props {
    onSubmit: MouseEventHandler<HTMLButtonElement>;
    onChange: ChangeEventHandler<HTMLInputElement>;
    value: string;
    showSearchIcon?: boolean;
    suffix?: ReactNode;
    unstyled?: boolean;
}

const SearchField = ({ onSubmit, onChange, value, showSearchIcon = true, suffix, unstyled }: Props) => (
    <div className="relative flex-item-fluid">
        <InputFieldTwo
            id="search-keyword"
            unstyled={unstyled}
            title={c('Label').t`Keyword`}
            prefix={
                showSearchIcon && (
                    <Button onClick={onSubmit} shape="ghost" color="weak" size="small" icon>
                        <Icon name="magnifier" alt={c('action').t`Search messages`} />
                    </Button>
                )
            }
            dense
            placeholder={c('Placeholder').t`Search messages`}
            value={value}
            autoFocus
            onChange={onChange}
            data-shorcut-target="searchbox-field"
            suffix={suffix}
        />
    </div>
);

export default SearchField;
