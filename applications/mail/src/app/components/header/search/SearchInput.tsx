import { forwardRef, Ref } from 'react';
import { c } from 'ttag';
import { useHistory } from 'react-router-dom';
import { Button, Icon } from '@proton/components';
import { SearchParameters } from '../../../models/tools';
import { isSearch as testIsSearch } from '../../../helpers/elements';

interface Props {
    searchParams: SearchParameters;
    onOpen: () => void;
}

const SearchInput = ({ searchParams, onOpen }: Props, ref: Ref<HTMLInputElement>) => {
    const history = useHistory();

    const placeholder = c('Placeholder').t`Search messages`;

    const isSearch = testIsSearch(searchParams);

    const handleClear = () => {
        history.push(history.location.pathname);
    };

    return (
        <div
            ref={ref}
            className="searchbox-container flex-item-centered-vert p0 field-two-input flex flex-row cursor-pointer"
        >
            <Button
                type="submit"
                icon
                shape="ghost"
                color="weak"
                className="flex flex-item-noshrink no-pointer-events"
                title={c('Action').t`Search`}
                onClick={onOpen}
                data-shorcut-target="searchbox-button"
            >
                <Icon name="magnifier" size={16} className="mauto" />
                <span className="sr-only">{c('Action').t`Search`}</span>
            </Button>
            <div
                className="flex flex-align-items-center flex-item-fluid pl0-25"
                data-testid="search-keyword"
                onClick={onOpen}
            >
                <span className="text-ellipsis">
                    {searchParams.keyword ? searchParams.keyword : <span className="placeholder">{placeholder}</span>}
                </span>
            </div>
            {isSearch ? (
                <Button
                    type="button"
                    shape="ghost"
                    color="weak"
                    size="small"
                    className="flex mtauto mbauto mr0-1"
                    title={c('Action').t`Clear`}
                    onClick={handleClear}
                >
                    {c('Action').t`Clear`}
                </Button>
            ) : null}
        </div>
    );
};

export default forwardRef(SearchInput);
