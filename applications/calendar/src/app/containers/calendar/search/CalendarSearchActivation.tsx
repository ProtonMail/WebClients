import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, Tooltip } from '@proton/components/components';
import useEncryptedSearchState from '@proton/encrypted-search/lib/useEncryptedSearchState';
import { CALENDAR_APP_NAME } from '@proton/shared/lib/constants';

import { useEncryptedSearchLibrary } from '../../EncryptedSearchLibraryProvider';
import CalendarSearchProgress from './CalendarSearchProgress';

interface Props {
    isIndexing: boolean;
    onClose: () => void;
}
const CalendarSearchActivation = ({ isIndexing, onClose }: Props) => {
    const { isLibraryInitialized, enableEncryptedSearch, getProgressRecorderRef } = useEncryptedSearchLibrary();
    const esState = useEncryptedSearchState({
        isIndexing,
        getProgressRecorderRef,
    });

    useEffect(() => {
        if (!isLibraryInitialized) {
            return;
        }
        void enableEncryptedSearch();
    }, [isLibraryInitialized]);

    return (
        <div className="p-4">
            <div className="text-bold text-xl flex flex-justify-space-between flex-align-items-center">
                <span>{c('Title').t`Enabling Calendar Search`}</span>
                <Tooltip title={c('Action').t`Close`}>
                    <Button icon color="weak" shape="ghost" onClick={onClose}>
                        <Icon name="cross" size={20} />
                    </Button>
                </Tooltip>
            </div>
            <div>
                {c('Description')
                    .t`To enable truly private search ${CALENDAR_APP_NAME} needs to index your files locally. You can still use ${CALENDAR_APP_NAME} normally — we'll let you know when indexing is done.`}
            </div>
            <CalendarSearchProgress esState={esState} />
        </div>
    );
};

export default CalendarSearchActivation;
