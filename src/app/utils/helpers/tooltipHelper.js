const tooltipModel = (reference, options) =>
    new Tooltip(reference, {
        container: 'body',
        placement: 'top',
        trigger: 'hover', // The default value for trigger is 'hover focus'
        ...options
    });

export default tooltipModel;
