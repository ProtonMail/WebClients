function validateActions({ Actions = {} }) {
    const errors = [];

    if (!(Actions.Labels || []).some(({ Selected }) => Selected)) {
        errors.push('labels');
    }

    !(Actions.Mark.Starred || Actions.Mark.Read) && errors.push('mark');
    !Actions.Move && errors.push('move');
    !(Actions.FileInto || []).length && errors.push('fileinto');
    !Actions.Vacation && errors.push('vacation');

    return {
        isValid: errors.length < 5,
        errors
    };
}

function validateConditions({ Conditions = [] }) {
    if (!Conditions.length) {
        return {
            isValid: false,
            isEmpty: true
        };
    }

    return Conditions.reduce(
        (acc, { Comparator = {}, Type, Values }) => {
            const errors = [];
            // No value for attachments as we use contains or !contains as condition
            !Values.length && Type.value !== 'attachments' && errors.push('value');
            (!Type.value || Type.value === 'select') && errors.push('type');
            !Comparator.value && errors.push('comparator');
            const isValid = !errors.length;
            acc.conditions.push({ isValid, errors });
            !isValid && (acc.isValid = false);
            return acc;
        },
        { isValid: true, conditions: [] }
    );
}

export function validate({ Name, Simple = {} }) {
    const { isValid: isValidCondition, conditions = [] } = validateConditions(Simple);
    const config = {
        name: {
            isValid: !!Name.length,
            isEmpty: !Name.length
        },
        conditions,
        actions: validateActions(Simple)
    };

    return {
        ...config,
        isValid: config.name.isValid && config.actions.isValid && isValidCondition
    };
}

export function validateComplex({ Name, Sieve }, isInvalidLinter) {
    const config = {
        name: {
            isValid: !!Name.length,
            isEmpty: !Name.length
        },
        sieve: {
            isValid: !!Sieve.length && !isInvalidLinter
        }
    };

    return {
        ...config,
        isValid: config.name.isValid && config.sieve.isValid
    };
}
