/* @ngInject */
function timepickerModel(dispatchers, gettextCatalog) {
    const { on, unsubscribe, dispatcher } = dispatchers(['timepicker']);

    // sends an event to show the specified weekdaytimepicker that the timestamp has been changed programmatically
    function refresh(refreshKey, timestamp, zone) {
        dispatcher.timepicker('refresh', { eventKey: refreshKey, timestamp, zone });
    }

    const daysInMonth = [
        { label: gettextCatalog.getString('1st of the month', null, 'Day of the month select value'), value: 0 },
        { label: gettextCatalog.getString('2nd of the month', null, 'Day of the month select value'), value: 1 },
        { label: gettextCatalog.getString('3rd of the month', null, 'Day of the month select value'), value: 2 },
        { label: gettextCatalog.getString('4th of the month', null, 'Day of the month select value'), value: 3 },
        { label: gettextCatalog.getString('5th of the month', null, 'Day of the month select value'), value: 4 },
        { label: gettextCatalog.getString('6th of the month', null, 'Day of the month select value'), value: 5 },
        { label: gettextCatalog.getString('7th of the month', null, 'Day of the month select value'), value: 6 },
        { label: gettextCatalog.getString('8th of the month', null, 'Day of the month select value'), value: 7 },
        { label: gettextCatalog.getString('9th of the month', null, 'Day of the month select value'), value: 8 },
        { label: gettextCatalog.getString('10th of the month', null, 'Day of the month select value'), value: 9 },
        { label: gettextCatalog.getString('11th of the month', null, 'Day of the month select value'), value: 10 },
        { label: gettextCatalog.getString('12th of the month', null, 'Day of the month select value'), value: 11 },
        { label: gettextCatalog.getString('13th of the month', null, 'Day of the month select value'), value: 12 },
        { label: gettextCatalog.getString('14th of the month', null, 'Day of the month select value'), value: 13 },
        { label: gettextCatalog.getString('15th of the month', null, 'Day of the month select value'), value: 14 },
        { label: gettextCatalog.getString('16th of the month', null, 'Day of the month select value'), value: 15 },
        { label: gettextCatalog.getString('17th of the month', null, 'Day of the month select value'), value: 16 },
        { label: gettextCatalog.getString('18th of the month', null, 'Day of the month select value'), value: 17 },
        { label: gettextCatalog.getString('19th of the month', null, 'Day of the month select value'), value: 18 },
        { label: gettextCatalog.getString('20th of the month', null, 'Day of the month select value'), value: 19 },
        { label: gettextCatalog.getString('21st of the month', null, 'Day of the month select value'), value: 20 },
        { label: gettextCatalog.getString('22nd of the month', null, 'Day of the month select value'), value: 21 },
        { label: gettextCatalog.getString('23rd of the month', null, 'Day of the month select value'), value: 22 },
        { label: gettextCatalog.getString('24th of the month', null, 'Day of the month select value'), value: 23 },
        { label: gettextCatalog.getString('25th of the month', null, 'Day of the month select value'), value: 24 },
        { label: gettextCatalog.getString('26th of the month', null, 'Day of the month select value'), value: 25 },
        { label: gettextCatalog.getString('27th of the month', null, 'Day of the month select value'), value: 26 },
        { label: gettextCatalog.getString('28th of the month', null, 'Day of the month select value'), value: 27 },
        { label: gettextCatalog.getString('29th of the month', null, 'Day of the month select value'), value: 28 },
        { label: gettextCatalog.getString('30th of the month', null, 'Day of the month select value'), value: 29 },
        { label: gettextCatalog.getString('31st of the month', null, 'Day of the month select value'), value: 30 }
    ];

    const timePickerConfig = {};

    function initTimePicker(eventKey, config) {
        timePickerConfig[eventKey] = config;
        dispatcher.timepicker('initTimePicker', config);
    }

    function onInitTimePicker(eventKey, func) {
        on('timepicker', (e, { type, data }) => {
            if (type === 'initTimepicker') {
                func(data);
            }
        });
        if (eventKey in timePickerConfig) {
            func(timePickerConfig[eventKey]);
        }
        /*
                return a function that cleans up the config and the rootscope listener.
            */
        return () => {
            delete timePickerConfig[eventKey];
            unsubscribe();
        };
    }

    return { init: angular.noop, refresh, daysInMonth, initTimePicker, onInitTimePicker };
}
export default timepickerModel;
