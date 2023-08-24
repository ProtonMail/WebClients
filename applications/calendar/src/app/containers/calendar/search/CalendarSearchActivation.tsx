import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, Tooltip } from '@proton/components/components';

import { useEncryptedSearchLibrary } from '../../EncryptedSearchLibraryProvider';
import CalendarSearchProgress from './CalendarSearchProgress';

interface Props {
    onClose: () => void;
}

const CalendarSearchActivation = ({ onClose }: Props) => {
    const { isLibraryInitialized, enableEncryptedSearch, pauseMetadataIndexing, esIndexingProgressState, esStatus } =
        useEncryptedSearchLibrary();

    const { isMetadataIndexingPaused, isConfigFromESDBLoaded } = esStatus;

    useEffect(() => {
        if (!isLibraryInitialized || !isConfigFromESDBLoaded) {
            return;
        }

        if (!isMetadataIndexingPaused) {
            void enableEncryptedSearch();
        }
    }, [isLibraryInitialized, isMetadataIndexingPaused, isConfigFromESDBLoaded]);

    return (
        <div className="p-4">
            <div className="text-bold text-xl flex flex-justify-space-between flex-align-items-center flex-nowrap mb-4">
                <span>{c('Title').t`We're setting up Calendar search`}</span>
                <Tooltip title={c('Action').t`Close`}>
                    <Button icon color="weak" shape="ghost" onClick={onClose}>
                        <Icon name="cross" size={20} />
                    </Button>
                </Tooltip>
            </div>
            <div className="mb-4">
                {c('Description').t`This can take a few minutes. Meanwhile, you can continue using Calendar as usual.`}
            </div>
            <CalendarSearchProgress esState={esIndexingProgressState} isPaused={isMetadataIndexingPaused} />
            <div className="flex flex-row-reverse ">
                <Button shape="ghost" color="norm" onClick={onClose}>
                    {c('Action').t`Got it`}
                </Button>
                {esStatus.isMetadataIndexingPaused ? (
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
