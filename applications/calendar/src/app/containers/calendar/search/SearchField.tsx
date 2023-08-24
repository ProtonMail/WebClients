import { MouseEventHandler, forwardRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, InputFieldTwo } from '@proton/components';
import { InputFieldProps } from '@proton/components/components/v2/field/InputField';

interface Props extends InputFieldProps<typeof InputFieldTwo> {
    onSubmit: MouseEventHandler<HTMLButtonElement>;
    showSearchIcon?: boolean;
}

const SearchField = ({ showSearchIcon = true, onSubmit, ...inputProps }: Props, ref: React.Ref<HTMLInputElement>) => (
    <div className="relative flex-item-fluid">
        <InputFieldTwo
            id="search-keyword"
            title={c('Label').t`Keyword`}
            prefix={
                showSearchIcon && (
                    <Button onClick={onSubmit} shape="ghost" color="weak" size="small" icon>
                        <Icon name="magnifier" alt={c('Action').t`Search events`} />
                    </Button>
                )
            }
            placeholder={c('Placeholder').t`Search events`}
            data-shorcut-target="searchbox-field"
            ref={ref}
            dense
            autoFocus
            {...inputProps}
        />
    </div>
);

export default forwardRef(SearchField);
