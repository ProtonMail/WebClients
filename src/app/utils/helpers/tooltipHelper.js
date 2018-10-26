const tooltipModel = (reference, options) => {
    return new Tooltip(reference, {
        container: 'body',
        placement: 'top',
        trigger: 'hover', // The default value for trigger is 'hover focus',
        popperOptions: {
            modifiers: {
                preventOverflow: {
                    boundariesElement: 'viewport'
                }
            }
        },
        ...options
    });
};

export default tooltipModel;
