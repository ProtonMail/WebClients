// create the autoresponder by requiring each spec instead of putting the specs in the protactor file
// this allows us to run the same spec multiple times.
require('../login/straightLogin.spec');
require('../util/waitForInbox.spec')();
require('./scenarios/autoresponder_forever.test')();
require('../util/resetToInbox.spec')();
require('./scenarios/autoresponder_fixed.test')();
require('../util/resetToInbox.spec')();
require('./scenarios/autoresponder_daily.test')();
require('../util/resetToInbox.spec')();
require('./scenarios/autoresponder_weekly.test')();
require('../util/resetToInbox.spec')();
require('./scenarios/autoresponder_monthly.test')();
require('../util/relogToFree.spec')();
require('../util/waitForInbox.spec')();
require('./scenarios/autoresponder_free.test')();
