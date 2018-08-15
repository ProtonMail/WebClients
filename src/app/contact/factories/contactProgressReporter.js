/* @ngInject */
function contactProgressReporter(dispatchers) {
    const { dispatcher } = dispatchers(['progressBar']);

    /**
     * Creates a function that reports the progress to the contactsProgressBar. Is used to keep track of the progress
     * value for you.
     * @param {Integer} progressStart
     * @param {Integer} progressEnd
     * @param {Integer} total
     * @return {Function}
     */
    return (progressStart, progressEnd, total) => {
        let current = 0;
        return (amount = 1) => {
            current += amount;
            // more stable to recalculate every time
            const progress = Math.floor(progressStart + (current * (progressEnd - progressStart)) / total);
            dispatcher.progressBar('contactsProgressBar', { progress });
        };
    };
}
export default contactProgressReporter;
