import { add } from 'date-fns';
import { c, msgid } from 'ttag';

import {
    AlertModal,
    Button,
    Info,
    Label,
    Progress,
    Toggle,
    Tooltip,
    classnames,
    useModalState,
    useUser,
} from '@proton/components';
import { ESIndexingState } from '@proton/encrypted-search';
import { isPaid } from '@proton/shared/lib/user/helpers';

import { useEncryptedSearchContext } from '../../../../containers/EncryptedSearchProvider';
import { formatSimpleDate } from '../../../../helpers/date';

interface Props {
    esState: ESIndexingState;
}

const EncryptedSearchField = ({ esState }: Props) => {
    const [user] = useUser();
    const {
        enableEncryptedSearch,
        enableContentSearch,
        getESDBStatus,
        pauseIndexing,
        toggleEncryptedSearch,
        getProgressRecorderRef,
        activateContentSearch,
    } = useEncryptedSearchContext();
    const {
        isEnablingContentSearch,
        esEnabled,
        isDBLimited,
        isRefreshing,
        isEnablingEncryptedSearch,
        isPaused,
        contentIndexingDone,
        activatingPartialES,
        isMigrating,
    } = getESDBStatus();
    const { esProgress, oldestTime, totalIndexingItems, estimatedMinutes, currentProgressValue } = esState;

    const [enableESModalProps, setEnableESModalOpen] = useModalState();

    // Switches
    const showProgress =
        isPaid(user) &&
        (isEnablingContentSearch || isPaused || (contentIndexingDone && isRefreshing && !activatingPartialES));
    const showSubTitleSection = contentIndexingDone && !isRefreshing && isDBLimited && !isEnablingEncryptedSearch;
    const isEstimating = estimatedMinutes === 0 && (totalIndexingItems === 0 || esProgress !== totalIndexingItems);
    const showToggle = isEnablingContentSearch || isPaused || contentIndexingDone;

    // ES progress
    const progressFromBuildEvent = isRefreshing
        ? 0
        : Math.ceil((getProgressRecorderRef().current[0] / getProgressRecorderRef().current[1]) * 100);
    const progressValue = isEstimating ? progressFromBuildEvent : currentProgressValue;

    // Header
    const esTitle = <span className="mr0-5">{c('Action').t`Search message content`}</span>;
    // Remove one day from limit because the last day in IndexedDB might not be complete
    const oldestDate = formatSimpleDate(add(new Date(oldestTime), { days: 1 }));
    const subTitleSection = (
        // translator: the variable is a date, which is already localised
        <span className="color-weak mr0-5">{c('Info').jt`For messages newer than ${oldestDate}`}</span>
    );
    let esToggleTooltip = c('Info').t`Activation in progress`;
    if (contentIndexingDone && !isEnablingContentSearch) {
        esToggleTooltip = esEnabled
            ? c('Info').t`Turn off content search. Activation progress won't be lost.`
            : c('Info').t`Turn on to search the content of your messages`;
    }

    const esExplanation = isPaid(user)
        ? c('Info')
              .t`This action will download all messages so they can be searched locally. Clearing your browser data will disable this option.`
        : c('Info')
              .t`This action will download the most recent messages so they can be searched locally. Clearing your browser data will disable this option.`;

    const esActivationTooltip = isMigrating
        ? c('Info').t`Updating your local messages, message content won't be searched during this update`
        : c('Info').t`The local database is being prepared`;
    const esActivationLoading = isMigrating || isEnablingEncryptedSearch || activatingPartialES;
    const esActivationButton = (
        <Button onClick={() => setEnableESModalOpen(true)} loading={esActivationLoading}>
            {c('Action').t`Activate`}
        </Button>
    );

    const esCTA = showToggle ? (
        <Tooltip title={esToggleTooltip}>
            <span>
                <Toggle
                    id="es-toggle"
                    className="mlauto flex-item-noshrink"
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
    const info = <Info questionMark title={esExplanation} />;
    const esHeader = showToggle ? (
        <Label htmlFor="es-toggle" className="text-bold p0 pr1 flex flex-item-fluid flex-align-items-center w100">
            {esTitle}
            {info}
        </Label>
    ) : (
        <div className="text-bold p0 pr1 flex flex-item-fluid flex-align-items-center">
            {esTitle}
            {info}
        </div>
    );

    // Progress indicator
    const totalProgress = getProgressRecorderRef().current[1];
    const currentProgress = Math.min(esProgress, totalProgress);
    let progressStatus: string = '';
    if (isPaused) {
        progressStatus = c('Info').t`Indexing paused`;
    } else if (isEstimating) {
        progressStatus = c('Info').t`Estimating time remaining...`;
    } else if (isRefreshing) {
        progressStatus = c('Info').t`Updating message content search...`;
    } else {
        // translator: esProgress is a number representing the current message being fetched, totalIndexingItems is the total number of message in the mailbox
        progressStatus = c('Info').jt`Downloading message ${currentProgress} out of ${totalProgress}` as string;
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
            className={classnames(['mt1 mb1 flex-item-fluid', isPaused ? 'progress-bar--disabled' : undefined])}
        />
    );
    const disablePauseResumeButton = contentIndexingDone && !isEnablingContentSearch;
    const showPauseResumeButton = showProgress && (!contentIndexingDone || isEnablingContentSearch) && !isRefreshing;
    const pauseResumeButton = isPaused ? (
        <Button
            shape="solid"
            color="norm"
            className="ml1"
            onClick={() => enableContentSearch()}
            disabled={disablePauseResumeButton}
        >
            {c('Action').t`Resume`}
        </Button>
    ) : (
        <Button className="ml1" onClick={pauseIndexing} disabled={disablePauseResumeButton}>
            {c('Action').t`Pause`}
        </Button>
    );

    const handleEnableES = async () => {
        enableESModalProps.onClose();
        void enableEncryptedSearch().then(() => activateContentSearch());
    };

    return (
        <div className="pt0">
            <div className="flex flex-column">
                <div className="flex flex-nowrap flex-align-items-center mb1">
                    {esHeader}
                    {esCTA}
                    <AlertModal
                        title={c('Title').t`Enable message content search`}
                        buttons={[
                            <Button color="norm" onClick={handleEnableES}>{c('Action').t`Enable`}</Button>,
                            <Button onClick={enableESModalProps.onClose}>{c('Action').t`Cancel`}</Button>,
                        ]}
                        {...enableESModalProps}
                    >
                        {esExplanation}
                    </AlertModal>
                </div>
            </div>
            {showSubTitleSection && <div className="mb1">{subTitleSection}</div>}
            {showProgress && (
                <div className="mt0-5 mb1 flex flex-column">
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
                        className={classnames([
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
