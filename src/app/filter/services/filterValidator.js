import _ from 'lodash';

/* @ngInject */
function filterValidator(sieveLint) {
    async function validator({ filter = {}, hasLabels, hasMove, hasMark, hasVacation }) {
        const errors = [];
        // Check name
        const { Name = '' } = filter;
        if (!Name.length) {
            errors.push('name');
        }

        if (Object.keys(filter.Simple || {}).length) {
            // Simple mode Check conditions
            const { attachmentsCondition, pass } = _.reduce(
                filter.Simple.Conditions,
                (acc, condition) => {
                    const value = condition.Type.value;

                    if (['subject', 'sender', 'recipient'].includes(value)) {
                        acc.pass = acc.pass && !!condition.Values.length;
                    }

                    if (value === 'attachments') {
                        acc.attachmentsCondition++;
                    }
                    return acc;
                },
                { attachmentsCondition: 0, pass: true }
            );

            const test = pass && attachmentsCondition <= 1;
            !test && errors.push('conditions');

            const hasActions = hasLabels || hasMove || hasMark || hasVacation;

            !hasActions && errors.push('noactions');

            // Check actions
            const { Actions } = filter.Simple;

            if (hasLabels) {
                const assert = _.some(Actions.Labels, { Selected: true });
                !assert && errors.push('actions:labels');
            }

            if (hasMark) {
                const assert = !!(Actions.Mark.Starred || Actions.Mark.Read);
                !assert && errors.push('actions:mark');
            }

            if (hasMove) {
                const assert = !!Actions.Move;
                !assert && errors.push('actions:move');
            }

            if (hasVacation) {
                const assert = !!Actions.Vacation;
                !assert && errors.push('actions:vacation');
            }
        }

        const sieveCode = filter.Sieve || '';
        if (sieveCode) {
            const issues = await sieveLint.run(sieveCode);
            issues.length && errors.push('sieve');
        }

        return {
            valid: !errors.length,
            errors
        };
    }

    return validator;
}
export default filterValidator;
