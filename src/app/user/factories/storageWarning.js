import { KNOWLEDGE_BASE, STORAGE_WARNING, BASE_SIZE } from '../../constants';
import { getItem, setItem } from '../../../helpers/storageHelper';

const DEFAULT_STATE = {
    isModalOpen: false,
    percentage: 0,
    isLimitReached: false
};

/* @ngInject */
function storageWarning(gettextCatalog, dispatchers, authentication, $state, confirmModal, AppModel, translator) {
    const I18N = translator(() => ({
        LEARN_MORE: gettextCatalog.getString('Learn more', null, 'Link'),
        warningMessage(percentage) {
            return gettextCatalog.getString(
                `
                You have reached {{ percentage }}% of your storage capacity. Consider freeing up some space
                or purchasing more storage before you run out of capacity.
                `,
                { percentage },
                'Storage warning'
            );
        },
        reachedMessage() {
            return gettextCatalog.getString(
                `
                You have reached 100% of your storage capacity. You won't be able to send or receive emails
                unless you permanently delete some emails or purchase more storage. {{learnMoreLink}}.
                `,
                { learnMoreLink: `<a href="${KNOWLEDGE_BASE.STORAGE_WARNING}" target="_blank">${this.LEARN_MORE}</a>` },
                'Storage warning'
            );
        },
        DASHBOARD: gettextCatalog.getString('Go to dashboard', null, 'Action'),
        OK: gettextCatalog.getString('Ok', null, 'Action'),
        DO_NOT_REMIND: gettextCatalog.getString('Do not remind me', null, 'Action'),
        WARNING: gettextCatalog.getString('Warning', null, 'Title')
    }));

    const { on } = dispatchers();

    let state = {
        ...DEFAULT_STATE
    };

    /**
     * Open the modal, unless it is already open. Could happen if storage changes often.
     * @param {Object} params
     */
    const openModal = (params) => {
        if (state.isModalOpen) {
            return;
        }
        confirmModal.activate({
            params: {
                ...params,
                confirm() {
                    confirmModal.deactivate();
                    state.isModalOpen = false;
                    params.confirm && params.confirm();
                },
                cancel(...args) {
                    confirmModal.deactivate();
                    params.cancel && params.cancel(...args);
                    state.isModalOpen = false;
                }
            }
        });
    };

    /**
     * Open the warning modal. It is displayed when the user has reached over 90% storage.
     * @param {Number} percentage
     */
    const openWarningModal = (percentage) => {
        if (getItem(STORAGE_WARNING.KEY) === STORAGE_WARNING.VALUE) {
            return;
        }
        return openModal({
            icon: 'fa fa-exclamation-triangle',
            title: I18N.WARNING,
            message: I18N.warningMessage(percentage),
            confirmText: I18N.OK,
            cancelText: I18N.DO_NOT_REMIND,
            cancel(type) {
                // Ignore when clicking on the X
                type === 'btn' && setItem(STORAGE_WARNING.KEY, STORAGE_WARNING.VALUE);
            }
        });
    };

    /**
     * Open the limit reached modal. It is displayed when the user has reached 100% storage.
     */
    const openLimitModal = () => {
        openModal({
            icon: 'fa fa-exclamation-triangle',
            title: I18N.WARNING,
            message: I18N.reachedMessage(),
            cancelText: I18N.DASHBOARD,
            confirmText: I18N.OK,
            cancel(type) {
                // Ignore when clicking on the X
                type === 'btn' && $state.go('secured.dashboard');
            }
        });
    };

    /**
     * Update the state when the user's storage has changed.
     */
    const onStorageChanged = () => {
        const { UsedSpace = 0, MaxSpace = 500 * BASE_SIZE * BASE_SIZE } = authentication.user;
        const percentage = Math.ceil((UsedSpace / MaxSpace) * 100);
        state.percentage = Math.min(100, Math.max(percentage, 0));
        state.isLimitReached = state.percentage >= STORAGE_WARNING.REACHED_LIMIT;

        AppModel.set('storageLimitReached', state.isLimitReached);

        if (state.percentage >= STORAGE_WARNING.WARNING_LIMIT) {
            return openWarningModal(state.percentage);
        }
    };

    on('logout', () => {
        state = { ...DEFAULT_STATE };
        AppModel.set('storageLimitReached', state.isLimitReached);
    });
    on('setUser', onStorageChanged);
    on('updateUser', onStorageChanged);
    on('app.event', (e, { type }) => type === 'usedSpace' && onStorageChanged());
    onStorageChanged();

    return {
        isLimitReached: () => state.isLimitReached,
        showModal: openLimitModal
    };
}

export default storageWarning;
