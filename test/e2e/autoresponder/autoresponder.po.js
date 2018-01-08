
function isOpened() {
    // return browser.executeScript('return true');
    return browser.executeScript(`
            return !!$('.autoresponder-container').length && !!$('.autoresponder-container .pm_toggle').length;
    `).then((result) => {
        if (result) {
            return browser.sleep(100)
                .then(() => browser.executeScript(`
                        return !!$('.autoresponder-container').length && !!$('.autoresponder-container .pm_toggle').length;
                    `));
        }
        return Promise.resolve(result);
    });
}

function changeValue(selector, value) {
    // we use dispatchEvent as jquery.change doesn't trigger non-jquery event handlers.
    const json = JSON.stringify(value);
    return browser.executeScript(`
            var elem = $('${selector}');
            elem.val(${json})
            var evt = document.createEvent('HTMLEvents');
            evt.initEvent('change', true, true);
            elem[0].dispatchEvent(evt);
        `);
}

function getValue(selector) {
    return browser.executeScript(`
        return $('${selector}').val();
    `);
}

const setStartWeekday = (day) => changeValue('#datetimepickerStartTime select', day),
    getStartWeekday = () => getValue('#datetimepickerStartTime select').then(Number),
    setStartMonthday = (day) => changeValue('#datetimepickerStartTime select', day),
    getStartMonthday = () => getValue('#datetimepickerStartTime select').then(Number),
    setStartDate = (date) => changeValue('#datetimepickerStartTime .datepicker', date),
    getStartDate = () => getValue('#datetimepickerStartTime .datepicker'),
    setStartTime = (time) => changeValue('#datetimepickerStartTime input.timepicker', time),
    getStartTime = () => getValue('#datetimepickerStartTime input.timepicker'),
    setEndWeekday = (day) => changeValue('#datetimepickerEndTime select', day),
    getEndWeekday = () => getValue('#datetimepickerEndTime select').then(Number),
    setEndMonthday = (day) => changeValue('#datetimepickerEndTime select', day),
    getEndMonthday = () => getValue('#datetimepickerEndTime select').then(Number),
    setEndDate = (date) => changeValue('#datetimepickerEndTime .datepicker', date),
    getEndDate = () => getValue('#datetimepickerEndTime .datepicker'),
    setEndTime = (time) => changeValue('#datetimepickerEndTime input.timepicker', time),
    getEndTime = () => getValue('#datetimepickerEndTime input.timepicker'),
    setSubjectPrefix = (subject) => changeValue('#subject-prefix', subject),
    getSubjectPrefix = () => getValue('#subject-prefix'),
    setDuration = (duration) => changeValue('#select-duration', duration),
    getDuration = () => getValue('#select-duration').then(Number);

function navigate() {
    return browser.waitForAngular()
        .then(() => browser.executeScript('$(\'a[ui-sref="secured.account"]\').click();'))
        .then(() => browser.waitForAngular())
        .then(() => browser.executeScript('$(\'a[href="/autoresponder"]\').click();'))
        .then(() => browser.wait(() => isOpened(), 10000));
}

function canConfigure() {
    return browser.executeScript(`
            return !$('.autoresponder-container .pm_toggle').hasClass('disabled');
        `);
}

function enable() {
    return browser.executeScript(`
            return $('.autoresponder-container .pm_toggle').hasClass('on') || $('.autoresponder-container .pm_toggle').click();
        `);
}

function disable() {
    return browser.executeScript(`
            return $('.autoresponder-container .pm_toggle').hasClass('off') || $('.autoresponder-container .pm_toggle').click();
        `);
}

function isEnabled() {
    return browser.executeScript(`
            return $('.autoresponder-container .pm_toggle').hasClass('on');
        `);
}

function setEnabledDays(days) {
    const jsonDays = JSON.stringify(days);
    return browser.executeScript(`
            var days = ${jsonDays};
            $('#enabledDays > .pm_multiselect label > input')
                .each((key, ele) => {
                    if($(ele).prop('checked') != (days.indexOf(+$(ele).val()) != -1)) {
                        $(ele).click();
                    }
                });
            `);
}

function getEnabledDays() {
    return browser.executeScript(`
            return $('#enabledDays > .pm_multiselect label > input')
                .map((key, ele) => {
                    return $(ele).is(":checked") ? +$(ele).val() : null
                }).get();`
    );
}

function setMessage(message) {
    const jsonMessage = JSON.stringify(message);
    return browser.sleep(500).then(() => browser.executeScript(`
            const body = $('#autoresponderMessage')
            .find('.angular-squire-wrapper')
            .find('iframe')[0]
            .contentDocument
            .body;
            body.innerHTML = ${jsonMessage};
    `));
}

function getMessage() {
    return browser.executeScript(`
            const body = $('#autoresponderMessage')
            .find('.angular-squire-wrapper')
            .find('iframe')[0]
            .contentDocument
            .body;
            return body.innerHTML;
            `);
}
function save(password) {
    const jsonPassword = JSON.stringify(password);
    return browser.waitForAngular()
        .then(() => browser.sleep(500))
        .then(() => browser.executeScript(`
            var elem = $("#autoresponder-save");
            elem.click();
            `))
        .then(() => browser.sleep(1500))
        .then(() => browser.waitForAngular())
        .then(() => browser.executeScript(`
                if($(".pm_modal").is(":visible")) {
                    $(".pm_modal #loginPassword").val(${jsonPassword});
                    $(".pm_modal #loginPassword").change();
                    $(".pm_modal .pm_button.primary").click();
                    return true;
                }
                return false;`
        ))
        .then((result) => browser.sleep(result ? 6000 : 3000))
        .then(() => browser.waitForAngular());
}

module.exports = {
    FIXED_INTERVAL: 0,
    DAILY: 1,
    WEEKLY: 2,
    MONTHLY: 3,
    FOREVER: 4,
    // Set the start time
    setStartWeekday, getStartWeekday, setStartMonthday, getStartMonthday, setStartDate, getStartDate, setStartTime, getStartTime,
    // Set the end time
    setEndWeekday, getEndWeekday, setEndMonthday, getEndMonthday, setEndDate, getEndDate, setEndTime, getEndTime,
    // Other getter/setters
    setSubjectPrefix, getSubjectPrefix,
    setEnabledDays, getEnabledDays,
    setDuration, getDuration,
    setMessage, getMessage,
    // Moving to the page / checking page state
    navigate, isOpened, canConfigure,
    // Enabled/disabling
    enable, disable, isEnabled,
    // saving
    save
};
