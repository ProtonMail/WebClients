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
        <div ref={ref} className="searchbox-container flex flex-row bordered rounded">
            <Button
                type="submit"
                icon
                shape="ghost"
                color="weak"
                className="flex"
                title={c('Action').t`Search`}
                onClick={onOpen}
            >
                <Icon name="magnifying-glass" size={22} className="mauto" />
                <span className="sr-only">{c('Action').t`Search`}</span>
            </Button>
            <div className="flex flex-align-items-center flex-item-fluid" onClick={onOpen}>
                {searchParams.keyword ? searchParams.keyword : <span className="placeholder">{placeholder}</span>}
            </div>
            {isSearch ? (
                <Button
                    type="button"
                    icon
                    shape="ghost"
                    color="weak"
                    className="flex"
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
