import activePlan from './directives/activePlan';
import addVpn from './directives/addVpn';
import addonRow from './directives/addonRow';
import dashboardCurrencySelector from './directives/currencySelector';
import freeColumn from './directives/freeColumn';
import overviewSection from './directives/overviewSection';
import planPrice from './directives/planPrice';
import plusColumn from './directives/plusColumn';
import professionalColumn from './directives/professionalColumn';
import selectPlan from './directives/selectPlan';
import subscriptionSection from './directives/subscriptionSection';
import totalPlan from './directives/totalPlan';
import totalRows from './directives/totalRows';
import visionaryColumn from './directives/visionaryColumn';
import vpnColumns from './directives/vpnColumns';
import vpnDiscountPanel from './directives/vpnDiscountPanel';
import vpnRow from './directives/vpnRow';
import vpnSlider from './directives/vpnSlider';
import vpnTotal from './directives/vpnTotal';
import customProPlanModel from './factories/customProPlanModel';
import customVpnModel from './factories/customVpnModel';
import dashboardConfiguration from './factories/dashboardConfiguration';
import dashboardModel from './factories/dashboardModel';
import dashboardOptions from './factories/dashboardOptions';
import downgrade from './factories/downgrade';
import customProPlanModal from './modals/customProPlanModal';
import customVpnModal from './modals/customVpnModal';
import planListGenerator from './factories/planListGenerator';

export default angular
    .module('proton.dashboard', [])
    .factory('planListGenerator', planListGenerator)
    .directive('activePlan', activePlan)
    .directive('addVpn', addVpn)
    .directive('addonRow', addonRow)
    .directive('dashboardCurrencySelector', dashboardCurrencySelector)
    .directive('freeColumn', freeColumn)
    .directive('overviewSection', overviewSection)
    .directive('planPrice', planPrice)
    .directive('plusColumn', plusColumn)
    .directive('professionalColumn', professionalColumn)
    .directive('selectPlan', selectPlan)
    .directive('subscriptionSection', subscriptionSection)
    .directive('totalPlan', totalPlan)
    .directive('totalRows', totalRows)
    .directive('visionaryColumn', visionaryColumn)
    .directive('vpnColumns', vpnColumns)
    .directive('vpnDiscountPanel', vpnDiscountPanel)
    .directive('vpnRow', vpnRow)
    .directive('vpnSlider', vpnSlider)
    .directive('vpnTotal', vpnTotal)
    .factory('customProPlanModel', customProPlanModel)
    .factory('customVpnModel', customVpnModel)
    .factory('dashboardConfiguration', dashboardConfiguration)
    .factory('dashboardModel', dashboardModel)
    .factory('dashboardOptions', dashboardOptions)
    .factory('downgrade', downgrade)
    .factory('customProPlanModal', customProPlanModal)
    .factory('customVpnModal', customVpnModal).name;
