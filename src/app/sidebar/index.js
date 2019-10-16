import btnDisplayMobileSidebar from './directives/btnDisplayMobileSidebar';
import menuLabel from './directives/menuLabel';
import navigationItem from './directives/navigationItem';
import sidebar from './directives/sidebar';
import sidebarLabels from './directives/sidebarLabels';
import sidebarMobile from './directives/sidebarMobile';
import sidebarMobileHeader from './directives/sidebarMobileHeader';
import sidebarProgress from './directives/sidebarProgress';
import sidebarModel from './factories/sidebarModel';

export default angular
    .module('proton.sidebar', [])
    .directive('btnDisplayMobileSidebar', btnDisplayMobileSidebar)
    .directive('menuLabel', menuLabel)
    .directive('navigationItem', navigationItem)
    .directive('sidebar', sidebar)
    .directive('sidebarLabels', sidebarLabels)
    .directive('sidebarMobile', sidebarMobile)
    .directive('sidebarMobileHeader', sidebarMobileHeader)
    .directive('sidebarProgress', sidebarProgress)
    .factory('sidebarModel', sidebarModel).name;
