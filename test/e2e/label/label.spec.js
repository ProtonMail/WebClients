const webapp = require('../../e2e.utils/webapp');
const label = require('./label.po')();
const labelModal = require('./labelModal.po');
const modal = require('../../e2e.utils/modal');
const toolbar = require('../../e2e.utils/toolbar');
const notifs = require('../../e2e.utils/notifications');
const { isTrue, isFalse, assertUrl, assert, greaterThan } = require('../../e2e.utils/assertions');
const labelSettingsSuite = require('./scenarii/labelSettings.test');
const labelToolbarSuite = require('./scenarii/labelToolbar.test');

labelSettingsSuite();
labelToolbarSuite();
