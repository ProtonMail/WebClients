import { add } from 'date-fns';
import { c, msgid } from 'ttag';
import {
    Button,
    classnames,
    Info,
    Label,
    Progress,
    Toggle,
    Tooltip,
    useUser,
    AlertModal,
    useModalState,
} from '@proton/components';
import {
    getESCurrentProgress,
    getESTotal,
    ESIndexingState,
    indexKeyExists,
    isDBReadyAfterBuilding,
    wasIndexingDone,
    esStorageHelpers,
} from '@proton/encrypted-search';
import { useEncryptedSearchContext } from '../../../../containers/EncryptedSearchProvider';
import { formatSimpleDate } from '../../../../helpers/date';

interface Props {
    showMore: boolean;
    toggleShowMore: () => void;
    esState: ESIndexingState;
}

const EncryptedSearchField = ({ esState }: Props) => {
    const [user] = useUser();
    const { resumeIndexing, getESDBStatus, pauseIndexing, toggleEncryptedSearch } = useEncryptedSearchContext();
    const { isBuilding, esEnabled, isDBLimited, isRefreshing } = getESDBStatus();
    const { esProgress, oldestTime, totalIndexingMessages, estimatedMinutes, currentProgressValue } = esState;
    const { getES } = esStorageHelpers();

    const [enableESModalProps, setEnableESModalOpen] = useModalState();

    // Switches
    const showProgress = indexKeyExists(user.ID) && esEnabled && (!isDBReadyAfterBuilding(user.ID) || isRefreshing);
    const showSubTitleSection = wasIndexingDone(user.ID) && !isRefreshing && isDBLimited;
    const isEstimating =
        estimatedMinutes === 0 && (totalIndexingMessages === 0 || esProgress !== totalIndexingMessages);

    // ES progress
    const progressFromBuildEvent = isRefreshing ? 0 : getESCurrentProgress(user.ID);
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
    if (wasIndexingDone(user.ID) && !isBuilding) {
        esToggleTooltip = esEnabled
            ? c('Info').t`Turn off content search. Activation progress won't be lost.`
            : c('Info').t`Turn on to search the content of your messages`;
    }

    const esCTA = indexKeyExists(user.ID) ? (
        <Tooltip title={esToggleTooltip}>
            <span>
                <Toggle
                    id="es-toggle"
                    className="mlauto flex-item-noshrink"
                    checked={wasIndexingDone(user.ID) && esEnabled && !isBuilding}
                    onChange={toggleEncryptedSearch}
                    disabled={showProgress}
                />
            </span>
        </Tooltip>
    ) : (
        <Button onClick={() => setEnableESModalOpen(true)} loading={esEnabled && !isBuilding}>
            {c('Action').t`Activate`}
        </Button>
    );
    const info = (
        <Info
            questionMark
            title={c('Tooltip')
                .t`This action will download all messages so they can be searched locally. Clearing your browser data will disable this option.`}
        />
    );
    const esHeader = indexKeyExists(user.ID) ? (
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
    const totalProgressToShow = Math.max(esProgress, getESTotal(user.ID));
    let progressStatus: string = '';
    if (getES.Pause(user.ID)) {
        progressStatus = c('Info').t`Indexing paused`;
    } else if (isEstimating) {
        progressStatus = c('Info').t`Estimating time remaining...`;
    } else if (isRefreshing) {
        progressStatus = c('Info').t`Updating message content search...`;
    } else {
        // translator: esProgress is a number representing the current message being fetched, totalIndexingMessages is the total number of message in the mailbox
        progressStatus = c('Info').jt`Downloading message ${esProgress} out of ${totalProgressToShow}` as string;
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
            className={classnames([
                'mt1 mb1 flex-item-fluid',
                getES.Pause(user.ID) ? 'progress-bar--disabled' : undefined,
            ])}
        />
    );
    const disablePauseResumeButton = wasIndexingDone(user.ID) && isBuilding;
    const showPauseResumeButton = showProgress && (!wasIndexingDone(user.ID) || isBuilding) && !isRefreshing;
    const pauseResumeButton = getES.Pause(user.ID) ? (
        <Button
            shape="solid"
            color="norm"
            className="ml1 w90p"
            onClick={() => resumeIndexing()}
            disabled={disablePauseResumeButton}
        >
            {c('Action').t`Resume`}
        </Button>
    ) : (
        <Button className="ml1 w90p" onClick={pauseIndexing} disabled={disablePauseResumeButton}>
            {c('Action').t`Pause`}
        </Button>
    );

    const handleEnableES = async () => {
        enableESModalProps.onClose();
        await resumeIndexing();
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
                        {c('Info')
                            .t`This action will download all messages so they can be searched locally. Clearing your browser data will disable this option.`}
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
                            isEstimating || getES.Pause(user.ID) ? 'visibility-hidden' : undefined,
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
