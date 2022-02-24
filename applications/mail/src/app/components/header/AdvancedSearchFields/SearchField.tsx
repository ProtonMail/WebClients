import { c } from 'ttag';
import { Button, classnames, Icon, InputTwo, Label } from '@proton/components';
import { ChangeEventHandler, MouseEventHandler } from 'react';

interface Props {
    onSubmit: MouseEventHandler<HTMLButtonElement>;
    onChange: ChangeEventHandler<HTMLInputElement>;
    value: string;
    showEncryptedSearch: boolean;
}

const SearchField = ({ onSubmit, onChange, value, showEncryptedSearch }: Props) => (
    <div className={classnames([showEncryptedSearch ? 'mb0-5' : 'mb1-5', 'relative'])}>
        <Label className="advanced-search-label p0" htmlFor="search-keyword" title={c('Label').t`Keyword`}>
            <InputTwo
                id="search-keyword"
                className="pl3"
                placeholder={c('Placeholder').t`Search Messages`}
                value={value}
                autoFocus
                onChange={onChange}
            />
            <Button className="searchbox-search-button" onClick={onSubmit} shape="ghost" color="weak" icon>
                <Icon name="magnifying-glass" />
            </Button>
        </Label>
    </div>
);

export default SearchField;
