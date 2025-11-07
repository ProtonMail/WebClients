import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CALENDAR_APP_NAME } from '@proton/shared/lib/constants';

import { useEncryptedSearchLibrary } from '../../EncryptedSearchLibraryProvider';
import CalendarSearchProgress from './CalendarSearchProgress';

interface Props {
    onClose: () => void;
}

const CalendarSearchActivation = ({ onClose }: Props) => {
    const { isLibraryInitialized, enableEncryptedSearch, pauseMetadataIndexing, esIndexingProgressState, esStatus } =
        useEncryptedSearchLibrary();

    const { esEnabled, isMetadataIndexingPaused, isConfigFromESDBLoaded } = esStatus;

    useEffect(() => {
        if (!isLibraryInitialized || !isConfigFromESDBLoaded || esEnabled) {
            return;
        }

        if (!isMetadataIndexingPaused) {
            void enableEncryptedSearch({ notify: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-6B7FE3
    }, [isLibraryInitialized, isMetadataIndexingPaused, isConfigFromESDBLoaded, esEnabled]);

    return (
        <div className="px-6 py-4">
            <div aria-live="assertive" aria-atomic="true">
                <h1 className="text-bold text-xl flex justify-space-between items-center flex-nowrap mb-4">
                    {c('Title').t`We're setting up calendar search`}
                </h1>
                <div className="mb-4">
                    {c('Description')
                        .t`This can take a few minutes. Meanwhile, you can continue using ${CALENDAR_APP_NAME} as usual.`}
                </div>
            </div>

            <CalendarSearchProgress
                esIndexingProgressState={esIndexingProgressState}
                isPaused={isMetadataIndexingPaused}
            />
            <div className="flex flex-row-reverse justify-space-between ">
                <Button shape="solid" color="norm" onClick={onClose}>
                    {c('Action').t`Got it`}
                </Button>
                {esStatus.isMetadataIndexingPaused ? (
                    <Button
                        shape="outline"
                        color="weak"
                        onClick={() => {
                            void enableEncryptedSearch({ notify: true });
                        }}
                    >
                        {c('Action').t`Resume indexing`}
                    </Button>
                ) : (
                    <Button shape="outline" color="weak" onClick={pauseMetadataIndexing}>
                        {c('Action').t`Pause indexing`}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default CalendarSearchActivation;
