import { c } from 'ttag';
import { Button, classnames, Icon, InputTwo, Label } from '@proton/components';
import { ChangeEventHandler, MouseEventHandler } from 'react';

interface Props {
    onSubmit: MouseEventHandler<HTMLButtonElement>;
    onChange: ChangeEventHandler<HTMLInputElement>;
    value: string;
    showEncryptedSearch: boolean;
    showSearchIcon?: boolean;
}

const SearchField = ({ onSubmit, onChange, value, showEncryptedSearch, showSearchIcon = true }: Props) => (
    <div className={classnames(['relative flex-item-fluid', showEncryptedSearch ? 'mb0-5NON' : 'mb1-5NON'])}>
        <Label className="advanced-search-label p0" htmlFor="search-keyword" title={c('Label').t`Keyword`}>
            <InputTwo
                id="search-keyword"
                className={classnames(['advanced-search-field', showSearchIcon ? 'pl3' : 'pl0'])}
                placeholder={c('Placeholder').t`Search messages`}
                value={value}
                autoFocus
                onChange={onChange}
                data-shorcut-target="searchbox-field"
            />
            {showSearchIcon && (
                <Button className="searchbox-search-button" onClick={onSubmit} shape="ghost" color="weak" icon>
                    <Icon name="magnifying-glass" alt={c('action').t`Search messages`} />
                </Button>
            )}
        </Label>
    </div>
);

export default SearchField;
