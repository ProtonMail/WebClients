import tooltipModel from '../../utils/helpers/tooltipHelper';

/* @ngInject */
function wizardBuilder() {
    const tooltips = []; // Store all tooltip instance
    const hideTooltips = () => tooltips.forEach((tooltip) => tooltip.hide());

    const destroyTooltips = () => {
        tooltips.forEach((tooltip) => tooltip.dispose());
        tooltips.length = 0;
    };

    const loadTooltips = (step) => {
        switch (step) {
            case 2:
                tooltips.push(
                    tooltipModel($('#tour-layout'), {
                        title: '1',
                        placement: 'left',
                        trigger: 'manual'
                    })
                );
                tooltips.push(
                    tooltipModel($('#tour-settings'), {
                        title: '2',
                        placement: 'left',
                        trigger: 'manual'
                    })
                );
                break;
            case 3:
                tooltips.push(
                    tooltipModel($('#tour-label-dropdown'), {
                        title: '1',
                        placement: 'bottom',
                        trigger: 'manual'
                    })
                );
                tooltips.push(
                    tooltipModel($('#tour-folder-dropdown'), {
                        title: '2',
                        placement: 'bottom',
                        trigger: 'manual'
                    })
                );
                tooltips.push(
                    tooltipModel($('#tour-label-settings'), {
                        title: '3',
                        placement: 'top',
                        trigger: 'manual'
                    })
                );
                break;
            case 4:
                tooltips.push(
                    tooltipModel($('#tour-support'), {
                        title: '1',
                        placement: 'left',
                        trigger: 'manual'
                    })
                );
                break;
            default:
                break;
        }

        return tooltips;
    };

    const renderTooltips = (step) => {
        const id = setTimeout(() => {
            loadTooltips(step).forEach((tooltip) => tooltip.show());
            $('.tooltip:visible').addClass('tour');
            clearTimeout(id);
        });
    };

    return { hideTooltips, destroyTooltips, renderTooltips };
}
export default wizardBuilder;
