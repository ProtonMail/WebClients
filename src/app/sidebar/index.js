import btnDisplayMobileSidebar from './directives/btnDisplayMobileSidebar';
import donateBtn from './directives/donateBtn';
import menuLabel from './directives/menuLabel';
import navigationItem from './directives/navigationItem';
import navigationSettings from './directives/navigationSettings';
import sidebar from './directives/sidebar';
import sidebarLabels from './directives/sidebarLabels';
import sidebarContact from './directives/sidebarContact';
import sidebarMobile from './directives/sidebarMobile';
import sidebarMobileHeader from './directives/sidebarMobileHeader';
import sidebarProgress from './directives/sidebarProgress';
import sidebarModel from './factories/sidebarModel';
import sidebarSettingsModel from './factories/sidebarSettingsModel';

export default angular
    .module('proton.sidebar', [])
    .directive('btnDisplayMobileSidebar', btnDisplayMobileSidebar)
    .directive('donateBtn', donateBtn)
    .directive('menuLabel', menuLabel)
    .directive('navigationItem', navigationItem)
    .directive('navigationSettings', navigationSettings)
    .directive('sidebar', sidebar)
    .directive('sidebarLabels', sidebarLabels)
    .directive('sidebarContact', sidebarContact)
    .directive('sidebarMobile', sidebarMobile)
    .directive('sidebarMobileHeader', sidebarMobileHeader)
    .directive('sidebarProgress', sidebarProgress)
    .factory('sidebarModel', sidebarModel)
    .factory('sidebarSettingsModel', sidebarSettingsModel).name;
