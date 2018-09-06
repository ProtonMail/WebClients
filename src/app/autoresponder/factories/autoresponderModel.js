import _ from 'lodash';

/* @ngInject */
function autoresponderModel(
    autoresponderLanguage,
    eventManager,
    dispatchers,
    mailSettingsModel,
    networkActivityTracker,
    notification,
    settingsMailApi,
    signatureBuilder
) {
    const { dispatcher, on } = dispatchers(['autoresponder']);
    const now = new Date();
    const momentNow = moment(now);
    const timezones = _.map(moment.tz.names(), (name) => {
        const offset = momentNow.tz(name).format('Z');
        return {
            label: `${name}: UTC ${offset}`,
            value: name
        };
    });

    const constants = {
        FIXED_INTERVAL: 0,
        DAILY: 1,
        WEEKLY: 2,
        MONTHLY: 3,
        FOREVER: 4,
        HALF_MESSAGE_LENGTH: 2048,
        MAX_MESSAGE_LENGTH: 4096,
        HOUR: 60 * 60,
        DAY: 24 * 60 * 60
    };

    /**
     * Transform the DaysSelected array coming from the API to an object where
     * each day corresponds to a key with true or false.
     * @param {Array} DaysSelected
     */
    const transformDaysSelected = (DaysSelected = []) => {
        return DaysSelected.reduce((previous, value) => {
            previous[value] = true;
            return previous;
        }, _.extend({}, [...new Array(7)].map(() => false)));
    };

    // this object indicates the differences between the mailSettingsModel.AutoResponder and the unsaved changes
    let changedAutoresponder = {};

    const getChangedAutoresponder = () => changedAutoresponder;
    const updateChangedAutoresponder = (autoresponder) =>
        (changedAutoresponder = _.extend({}, changedAutoresponder, autoresponder));
    const clearChangedAutoresponder = () => (changedAutoresponder = {});
    const getBaseResponder = () => {
        // NOTE: Extracting these variables to solve the camelCase deprecation in the BE.
        const { IsEnabled, StartTime, EndTime, DaysSelected, Repeat, Subject, Message, Zone } = _.extend(
            {},
            mailSettingsModel.get('AutoResponder')
        );
        if (!IsEnabled) {
            // To ensure a new object.
            return { ...getDefaultAutoResponder() };
        }
        return {
            IsEnabled,
            StartTime,
            EndTime,
            DaysSelected: transformDaysSelected(DaysSelected),
            Repeat,
            Subject,
            Message,
            Zone
        };
    };
    const get = () => _.extend({}, getBaseResponder(), getChangedAutoresponder());
    const dispatch = (type, data) => dispatcher.autoresponder(type, data);

    function getDefaultAutoResponder() {
        const defaultAutoresponder = {
            IsEnabled: false,
            /*
                  startTime is an UTC timestamp: either since epoch,
                    since start of the day (in UTC),
                    since start of the week (in UTC),
                    since start of the month (in UTC)
                    By default it starts in an hour
                 */
            StartTime: Math.floor(Date.now() / 1000) + constants.HOUR,
            /*
                  endTime is an UTC timestamp: either since epoch,
                    since start of the day (in UTC),
                    since start of the week (in UTC),
                    since start of the month (in UTC)
                 */
            EndTime: null,
            /*
                only applicable for daily. Day 0 means Sunday and so on
            */
            DaysSelected: transformDaysSelected([0, 1, 2, 3, 4, 5, 6]),
            Repeat: constants.FIXED_INTERVAL,
            Subject: autoresponderLanguage.DEFAULT_SUBJECT_PREFIX,
            Message: null,
            Zone: moment.tz.guess()
        };

        const body = autoresponderLanguage.DEFAULT_BODY;

        const bodyPlusSig = signatureBuilder
            .insert({ getDecryptedBody: () => body }, { action: 'new', isAfter: true })
            .replace(/<img[^>]*>/g, '');

        if (bodyPlusSig.length > constants.MAX_MESSAGE_LENGTH) {
            defaultAutoresponder.Message = body;
        } else {
            defaultAutoresponder.Message = bodyPlusSig;
        }
        return defaultAutoresponder;
    }

    function load() {
        clearChangedAutoresponder();
        dispatch('update', { autoresponder: get() });
    }

    /*
         When the user is a free user we need to show a disabled interface that shows what can be done
         if you would get a paid subscription: essentially a mock-up is shown.
         So this fills the model with some example data.
         */
    function mock() {
        const data = getDefaultAutoResponder();
        data.IsEnabled = true;
        data.Repeat = 0;
        data.StartTime = Math.floor(Date.now() / 1000);
        // just an example value. Don't worry about it.
        data.EndTime = data.StartTime + 7 * constants.DAY + 8 * constants.HOUR;
        updateChangedAutoresponder(data);

        const outData = get();

        dispatch('update', { autoresponder: outData });
    }

    function set(autoresponderIn) {
        const newAutoresponder = _.extend({}, autoresponderIn);

        const oldAutoresponder = get();

        const tempAutoresponder = _.extend({}, oldAutoresponder, newAutoresponder);

        // switching timestamp should keep the timestring YYYY-MM-DDTHH:mm:ss the same.
        if (tempAutoresponder.Zone !== oldAutoresponder.Zone && tempAutoresponder.Repeat === constants.FIXED_INTERVAL) {
            // Let's convert the timestamp, so present the same YYYY-MM-DDTHH:mm:ss strings
            // this means that we format the old time and reinterpret as a being a string in the new timezone
            const startTime = tempAutoresponder.StartTime;
            const endTime = tempAutoresponder.EndTime;
            const oldZone = oldAutoresponder.Zone;
            const newZone = newAutoresponder.Zone;

            if (startTime !== null) {
                newAutoresponder.StartTime = Number(
                    moment.tz(moment.tz(startTime * 1000, oldZone).format('YYYY-MM-DDTHH:mm:ss'), newZone).format('X')
                );
            }
            if (endTime !== null) {
                newAutoresponder.EndTime = Number(
                    moment.tz(moment.tz(endTime * 1000, oldZone).format('YYYY-MM-DDTHH:mm:ss'), newZone).format('X')
                );
            }
        }

        if (typeof newAutoresponder.Repeat !== 'undefined' && oldAutoresponder.Repeat !== newAutoresponder.Repeat) {
            const isForever = newAutoresponder.Repeat === constants.FOREVER;

            newAutoresponder.StartTime = isForever ? 0 : null;
            newAutoresponder.EndTime = isForever ? 0 : null;

            if (newAutoresponder.Repeat === constants.FIXED_INTERVAL) {
                newAutoresponder.StartTime = Math.floor(Date.now() / 1000) + constants.HOUR;
            }

            if (typeof newAutoresponder.DaysSelected === 'undefined') {
                newAutoresponder.DaysSelected = { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true };
            }
        }

        updateChangedAutoresponder(newAutoresponder);

        const data = get();

        dispatch('update', { autoresponder: data });
    }

    function getAutoresponderInAPIFormat() {
        const autoresponder = get();

        autoresponder.DaysSelected = Object.keys(_.pickBy(autoresponder.DaysSelected, Boolean)).map(Number);

        if (autoresponder.Repeat === constants.FOREVER) {
            autoresponder.StartTime = 0;
            autoresponder.EndTime = 0;
        }

        return autoresponder;
    }

    function getResponseMessage(oldEnabled, newEnabled) {
        if (oldEnabled === newEnabled) {
            return autoresponderLanguage.AUTORESPONDER_UPDATED_MESSAGE;
        }
        return newEnabled
            ? autoresponderLanguage.AUTORESPONDER_INSTALLED_MESSAGE
            : autoresponderLanguage.AUTORESPONDER_REMOVED_MESSAGE;
    }

    /**
     * Returns whether the "remote" autoresponder isEnabled flag would be toggled by the action.
     * Needed because the intermittent value in this model is used before the network request has gone off.
     * @param {boolean} state
     * @returns {boolean}
     */
    function willUpdate(state) {
        const { IsEnabled } = mailSettingsModel.get('AutoResponder') || {};
        return IsEnabled !== state;
    }

    function save() {
        const autoresponder = getAutoresponderInAPIFormat();
        const original = getBaseResponder();
        const responseMessage = getResponseMessage(original.IsEnabled, autoresponder.IsEnabled);
        const promise = settingsMailApi
            .updateAutoresponder({ Parameters: autoresponder })
            .then((data) => eventManager.call().then(() => data))
            .then((data) => {
                dispatch('saved_success', data);
                notification.success(responseMessage);
            })
            // catch is thrown when the scope authentication is canceled.
            .catch((error) => dispatch('saved_error', { Error: error }));

        networkActivityTracker.track(promise);
    }

    on('autoresponder', (event, { type, data = {} }) => {
        if (type === 'save') {
            set(data.autoresponder);
            save();
        }
    });

    on('autoresponder.isEnabled', (event, { data: { status } }) => {
        set({ IsEnabled: status });
    });

    return { init: angular.noop, constants, load, mock, get, set, timezones, willUpdate };
}
export default autoresponderModel;
