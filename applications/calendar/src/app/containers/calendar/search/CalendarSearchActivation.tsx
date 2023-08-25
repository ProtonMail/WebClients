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
    const {
        isLibraryInitialized,
        enableEncryptedSearch,
        getProgressRecorderRef,
        pauseMetadataIndexing,
        getESDBStatus,
    } = useEncryptedSearchLibrary();
    const { isMetadataIndexingPaused } = getESDBStatus();
    const { esState } = useEncryptedSearchState({
        isIndexing,
        getProgressRecorderRef,
    });

    useEffect(() => {
        if (!isLibraryInitialized) {
            return;
        }

        if (!isMetadataIndexingPaused) {
            void enableEncryptedSearch();
        }
    }, [isLibraryInitialized, isMetadataIndexingPaused]);

    return (
        <div className="p-4">
            <div className="text-bold text-xl flex flex-justify-space-between flex-align-items-center flex-nowrap">
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
            <CalendarSearchProgress esState={esState} isPaused={isMetadataIndexingPaused} />
            <div className="flex flex-row-reverse mt-4">
                <Button shape="ghost" color="norm" onClick={onClose}>
                    {c('Action').t`Got it`}
                </Button>
                {isMetadataIndexingPaused ? (
                    <Button
                        shape="ghost"
                        color="norm"
                        onClick={() => {
                            void enableEncryptedSearch();
                        }}
                    >
                        {c('Action').t`Resume indexing`}
                    </Button>
                ) : (
                    <Button shape="ghost" color="norm" onClick={pauseMetadataIndexing}>
                        {c('Action').t`Pause indexing`}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default CalendarSearchActivation;
