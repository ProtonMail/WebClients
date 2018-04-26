/* @ngInject */
function wizardBuilder() {
    const hideTooltips = () => $('.tooltip').tooltip('hide');

    const loadTooltips = (step) => {
        let tooltips = [];

        switch (step) {
            case 2:
                $('#tour-layout').tooltip({
                    title: '1',
                    placement: 'left',
                    trigger: 'manual'
                });
                $('#tour-settings').tooltip({
                    title: '2',
                    placement: 'left',
                    trigger: 'manual'
                });
                tooltips = ['#tour-layout', '#tour-settings'];
                break;
            case 3:
                $('#tour-label-dropdown').tooltip({
                    title: '1',
                    placement: 'bottom',
                    trigger: 'manual'
                });
                $('#tour-folder-dropdown').tooltip({
                    title: '2',
                    placement: 'bottom',
                    trigger: 'manual'
                });
                $('#tour-label-settings').tooltip({
                    title: '3',
                    placement: 'right',
                    trigger: 'manual'
                });
                tooltips = ['#tour-label-dropdown', '#tour-label-settings', '#tour-folder-dropdown'];
                break;
            case 4:
                $('#tour-support').tooltip({
                    title: '1',
                    placement: 'left',
                    trigger: 'manual'
                });
                tooltips = ['#tour-support'];
                break;
            default:
                break;
        }

        return tooltips;
    };

    const renderTooltips = (step) => {
        const id = setTimeout(() => {
            $(loadTooltips(step)).tooltip('show');
            $('.tooltip:visible').addClass('tour');
            clearTimeout(id);
        });
    };

    return { hideTooltips, renderTooltips };
}
export default wizardBuilder;
