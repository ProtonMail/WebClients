import { add } from 'date-fns';
import { c, msgid } from 'ttag';

import { Button, Href } from '@proton/atoms';
import { Info, Label, Progress, Prompt, Toggle, Tooltip, useModalState } from '@proton/components';
import { ESIndexingState } from '@proton/encrypted-search';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

import { useEncryptedSearchContext } from '../../../../containers/EncryptedSearchProvider';
import { formatSimpleDate } from '../../../../helpers/date';

interface Props {
    esState: ESIndexingState;
}

const EncryptedSearchField = ({ esState }: Props) => {
    const {
        enableEncryptedSearch,
        enableContentSearch,
        getESDBStatus,
        pauseIndexing,
        toggleEncryptedSearch,
        getProgressRecorderRef,
    } = useEncryptedSearchContext();
    const {
        isEnablingContentSearch,
        esEnabled,
        isDBLimited,
        isRefreshing,
        isEnablingEncryptedSearch,
        isPaused,
        contentIndexingDone,
    } = getESDBStatus();
    const { esProgress, oldestTime, totalIndexingItems, estimatedMinutes, currentProgressValue } = esState;

    const [enableESModalProps, setEnableESModalOpen] = useModalState();

    // Switches
    const showProgress = isEnablingContentSearch || isPaused || (contentIndexingDone && isRefreshing);
    const showSubTitleSection = contentIndexingDone && !isRefreshing && isDBLimited && !isEnablingEncryptedSearch;
    let isEstimating = estimatedMinutes === 0 && (totalIndexingItems === 0 || esProgress !== totalIndexingItems);
    const showToggle = isEnablingContentSearch || isPaused || contentIndexingDone;

    // ES progress
    const progressFromBuildEvent = isRefreshing
        ? 0
        : Math.ceil((getProgressRecorderRef().current[0] / getProgressRecorderRef().current[1]) * 100);
    const progressValue = isEstimating ? progressFromBuildEvent : currentProgressValue;

    // Header
    const esTitle = <span className="mr-2">{c('Action').t`Search message content`}</span>;
    // Remove one day from limit because the last day in IndexedDB might not be complete
    const oldestDate = formatSimpleDate(add(new Date(oldestTime), { days: 1 }));
    const subTitleSection = (
        // translator: the variable is a date, which is already localised
        <span className="color-weak mr-2">{c('Info').jt`For messages newer than ${oldestDate}`}</span>
    );
    let esToggleTooltip = c('Info').t`Activation in progress`;
    if (contentIndexingDone && !isEnablingContentSearch) {
        esToggleTooltip = esEnabled
            ? c('Info')
                  .t`Turn off to only search by date, name, email address, or subject line. To disable search message content and delete downloaded messages, go to settings.`
            : c('Info').t`Turn on to search the content of your messages`;
    }

    const esActivationTooltip = c('Info').t`The local database is being prepared`;
    const esActivationLoading = isEnablingEncryptedSearch;
    const esActivationButton = (
        <Button
            onClick={() => setEnableESModalOpen(true)}
            loading={esActivationLoading}
            data-testid="encrypted-search:activate"
        >
            {esActivationLoading ? c('Action').t`Downloading` : c('Action').t`Enable`}
        </Button>
    );

    const esCTA = showToggle ? (
        <Tooltip title={esToggleTooltip}>
            <span>
                <Toggle
                    id="es-toggle"
                    className="ml-auto flex-item-noshrink"
                    checked={contentIndexingDone && esEnabled && !isEnablingContentSearch}
                    onChange={toggleEncryptedSearch}
                    disabled={showProgress}
                />
            </span>
        </Tooltip>
    ) : esActivationLoading ? (
        <Tooltip title={esActivationTooltip}>
            <span>{esActivationButton}</span>
        </Tooltip>
    ) : (
        esActivationButton
    );
    const info = (
        <Info
            questionMark
            title={c('Info').t`Search option that lets you securely search for keywords in the body of email messages.`}
        />
    );
    const esHeader = showToggle ? (
        <Label htmlFor="es-toggle" className="text-bold p-0 pr-4 flex flex-item-fluid flex-align-items-center w100">
            {esTitle}
            {info}
        </Label>
    ) : (
        <div className="text-bold p-0 pr-4 flex flex-item-fluid flex-align-items-center">
            {esTitle}
            {info}
        </div>
    );

    // Progress indicator
    const totalProgress = getProgressRecorderRef().current[1];
    const currentProgress = Math.min(esProgress, totalProgress);
    isEstimating ||= currentProgress === 0;
    let progressStatus: string = '';
    if (isPaused) {
        progressStatus = c('Info').t`Downloading paused`;
    } else if (isEstimating) {
        progressStatus = c('Info').t`Estimating time remaining...`;
    } else if (isRefreshing) {
        progressStatus = c('Info').t`Updating message content search...`;
    } else {
        // translator: esProgress is a number representing the current message being fetched, totalIndexingItems is the total number of message in the mailbox
        progressStatus = c('Info').ngettext(
            msgid`Message downloaded: ${currentProgress} out of ${totalProgress}`,
            `Messages downloaded: ${currentProgress} out of ${totalProgress}`,
            currentProgress
        ) as string;
    }

    const etaMessage =
        estimatedMinutes <= 1
            ? c('Info').t`Estimated time remaining: Less than a minute`
            : // translator: the variable is a positive integer (written in digits) always strictly bigger than 1
              c('Info').ngettext(
                  msgid`Estimated time remaining: ${estimatedMinutes} minute`,
                  `Estimated time remaining: ${estimatedMinutes} minutes`,
                  estimatedMinutes
              );
    const progressBar = (
        <Progress
            value={progressValue || 0}
            aria-describedby="timeRemaining"
            className={clsx(['my-4 flex-item-fluid', isPaused ? 'progress-bar--disabled' : undefined])}
        />
    );
    const disablePauseResumeButton = contentIndexingDone && !isEnablingContentSearch;
    const showPauseResumeButton = showProgress && (!contentIndexingDone || isEnablingContentSearch) && !isRefreshing;
    const pauseResumeButton = isPaused ? (
        <Button
            shape="solid"
            color="norm"
            className="ml-4"
            onClick={() => enableContentSearch()}
            disabled={disablePauseResumeButton}
        >
            {c('Action').t`Resume`}
        </Button>
    ) : (
        <Button className="ml-4" onClick={pauseIndexing} disabled={disablePauseResumeButton}>
            {c('Action').t`Pause`}
        </Button>
    );

    const handleEnableES = async () => {
        enableESModalProps.onClose();
        void enableEncryptedSearch().then((success) => (success ? enableContentSearch() : undefined));
    };

    return (
        <div className="pt-0">
            <div className="flex flex-column">
                <div className="flex flex-nowrap flex-align-items-center mb-4">
                    {esHeader}
                    {esCTA}
                    <Prompt
                        title={c('Title').t`Enable message content search`}
                        buttons={[
                            <Button color="norm" onClick={handleEnableES} data-testid="encrypted-search:enable">{c(
                                'Action'
                            ).t`Enable`}</Button>,
                            <Button onClick={enableESModalProps.onClose}>{c('Action').t`Cancel`}</Button>,
                        ]}
                        {...enableESModalProps}
                    >
                        {c('Action')
                            .t`To search your emails securely, we need to download a copy of your messages to your browser. The initial download may take a moment.`}
                        <br />
                        <Href href={getKnowledgeBaseUrl('/search-message-content')}>{c('Info').t`Learn more`}</Href>
                    </Prompt>
                </div>
            </div>
            {showSubTitleSection && <div className="mb-4">{subTitleSection}</div>}
            {showProgress && (
                <div className="mt-2 mb-4 flex flex-column">
                    <span
                        className="color-weak relative advanced-search-progress-status"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {progressStatus}
                    </span>
                    <div className="flex flex-justify-space-between">
                        {progressBar}
                        {showPauseResumeButton && pauseResumeButton}
                    </div>
                    <span
                        id="timeRemaining"
                        aria-live="polite"
                        aria-atomic="true"
                        className={clsx([
                            'color-weak relative advanced-search-time-remaining',
                            isEstimating || isPaused ? 'visibility-hidden' : undefined,
                        ])}
                    >
                        {etaMessage}
                    </span>
                </div>
            )}
        </div>
    );
};

export default EncryptedSearchField;
