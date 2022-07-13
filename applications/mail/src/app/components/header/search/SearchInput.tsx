import { forwardRef, Ref } from 'react';
import { c } from 'ttag';
import { useHistory } from 'react-router-dom';
import { Button, Icon, InputTwo } from '@proton/components';
import { SearchParameters } from '../../../models/tools';
import { isSearch as testIsSearch } from '../../../helpers/elements';

import './SearchInput.scss';

interface Props {
    searchParams: SearchParameters;
    onOpen: () => void;
}

const SearchInput = ({ searchParams, onOpen }: Props, ref: Ref<HTMLInputElement>) => {
    const history = useHistory();

    const isSearch = testIsSearch(searchParams);

    const handleClear = () => {
        history.push(history.location.pathname);
    };

    return (
        <div className="searchbox flex">
            <div ref={ref} className="w100 mauto">
                <InputTwo
                    className="cursor-pointer"
                    value={searchParams.keyword ? searchParams.keyword : ''}
                    placeholder={c('Placeholder').t`Search messages`}
                    onClick={onOpen}
                    data-testid="search-keyword"
                    readOnly
                    prefix={
                        <Button
                            type="submit"
                            icon
                            shape="ghost"
                            color="weak"
                            size="small"
                            className="no-pointer-events"
                            title={c('Action').t`Search`}
                            onClick={onOpen}
                            data-shorcut-target="searchbox-button"
                        >
                            <Icon name="magnifier" alt={c('Action').t`Search`} />
                        </Button>
                    }
                    suffix={
                        isSearch ? (
                            <Button
                                type="button"
                                shape="ghost"
                                color="weak"
                                size="small"
                                className="rounded-sm"
                                title={c('Action').t`Clear`}
                                onClick={handleClear}
                            >
                                {c('Action').t`Clear`}
                            </Button>
                        ) : null
                    }
                />
            </div>
        </div>
    );
};

export default forwardRef(SearchInput);
