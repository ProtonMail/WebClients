/* @ngInject */
function blackFridayHandler(Payment, blackFridayModel, dispatchers) {
    const SEPTEMBER_30 = +new Date('2019-10-30') / 1000; // Unix TS

    const isAbleToSeeBF = (latest = 0) => {
        // New user
        if (latest === null) {
            return true;
        }

        // Free from at least > 1 month
        return latest && latest < SEPTEMBER_30;
    };

    async function init() {
        const { dispatcher } = dispatchers(['blackFriday']);
        const { LastSubscriptionEnd } = await Payment.latestSubscription();
        if (isAbleToSeeBF(LastSubscriptionEnd)) {
            blackFridayModel.allow();
            dispatcher.blackFriday('run');
        }
    }

    return init;
}

export default blackFridayHandler;
