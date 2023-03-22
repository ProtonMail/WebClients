import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { Button } from '@proton/atoms/Button';
import {
    DateInput,
    InputTwo,
    Loader,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
} from '@proton/components/components';
import { ESItem } from '@proton/encrypted-search';
import { changeSearchParams } from '@proton/shared/lib/helpers/url';

import { ESCalendarMetadata } from '../../interfaces/encryptedSearch';
import { useEncryptedSearchContext } from '../EncryptedSearchProvider';

interface Props {
    open: boolean;
    close: () => void;
}

const EncryptedSearchModal = ({ open, close }: Props) => {
    const history = useHistory();
    const { getESDBStatus, enableEncryptedSearch, encryptedSearch, cacheIndexedDB } = useEncryptedSearchContext();
    const { dbExists, isEnablingEncryptedSearch, isRefreshing } = getESDBStatus();

    const isIndexing = isEnablingEncryptedSearch || isRefreshing;
    const searchIsActive = dbExists && !isIndexing;

    const [keyword, setKeyword] = useState('');
    const handleChangeKeyword = (e: React.ChangeEvent<HTMLInputElement>) => setKeyword(e.target.value);

    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const handleChangeStartDate = (change: Date | undefined) => {
        setStartDate(change);
    };

    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const handleChangeEndDate = (change: Date | undefined) => {
        setEndDate(change);
    };

    const handleClick = () => {
        if (!dbExists) {
            return enableEncryptedSearch();
        }

        // TODO: somehow it should also be possible to "exit" search mode
        history.push(
            changeSearchParams(`/es`, history.location.hash, {
                keyword,
                begin: startDate ? `${Math.round(startDate.getTime() / 1000)}` : undefined,
                end: endDate ? `${Math.round(endDate.getTime() / 1000)}` : undefined,
            })
        );
    };

    useEffect(() => {
        const setResultsList = (items: ESItem<ESCalendarMetadata, void>[]) => {
            if (!items.length) {
                console.log('No results found!');
            } else {
                console.log('Results found:');
                const recurringEvents = items.filter(({ RRule }) => !!RRule);
                const nonRecurringEvents = items.filter(({ RRule }) => !RRule);

                console.log(
                    '\tThese are recurring events, they should be expanded and verified against search dates',
                    recurringEvents
                );
                console.log(
                    '\tThese are non-recurring events, they have been already checked against search dates',
                    nonRecurringEvents
                );
            }
        };
        void encryptedSearch(setResultsList);

        close();
    }, [history.location]);

    const mainParagraphContent = !dbExists
        ? 'Build an index to use encrypted search.'
        : isEnablingEncryptedSearch
        ? 'Indexing in progress'
        : 'Enjoy your search';
    const primaryAction = isEnablingEncryptedSearch ? (
        <Loader />
    ) : (
        <Button color="norm" onClick={handleClick}>
            {dbExists ? 'Search' : 'Index'}
        </Button>
    );

    const inputFields = searchIsActive ? (
        <div>
            <InputTwo
                placeholder={'Keywords'}
                value={keyword}
                onChange={handleChangeKeyword}
                onFocus={cacheIndexedDB}
            />
            <DateInput value={startDate} onChange={handleChangeStartDate} />
            <DateInput value={endDate} onChange={handleChangeEndDate} />
        </div>
    ) : null;

    return (
        <ModalTwo open={open} onClose={close}>
            <ModalTwoHeader title="Encrypted Search PoC" />
            <ModalTwoContent>
                {mainParagraphContent}
                {inputFields}
            </ModalTwoContent>
            <ModalTwoFooter>{primaryAction}</ModalTwoFooter>
        </ModalTwo>
    );
};

export default EncryptedSearchModal;
