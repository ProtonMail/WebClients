/* @ngInject */
function filterValidator(sieveLint, userType) {
    function validateConditions(Conditions = []) {
        return Conditions.reduce(
            (acc, { Comparator = {}, Type, Values }) => {
                const errors = [];
                // No value for attachments as we use contains or !contains as condition
                !Values.length && Type.value !== 'attachments' && errors.push('value');
                (!Type.value || Type.value === 'select') && errors.push('type');
                !Comparator.value && errors.push('comparator');
                const isValid = !errors.length;
                acc.errors.push({ isValid, errors });
                !isValid && (acc.isValid = false);
                return acc;
            },
            { isValid: true, errors: [] }
        );
    }

    function validateActions(Actions = {}) {
        const isPaidUser = userType().isPaid;
        const hasLabels = ['archive', 'inbox'].includes(Actions.FileInto[0]) && Actions.FileInto.length > 1;
        const hasMove = !!Actions.Move;
        const hasMark = Actions.Mark.Read || Actions.Mark.Starred;
        const hasVacation = !!Actions.Vacation;
        const hasActions = hasLabels || hasMove || hasMark || (isPaidUser && hasVacation);

        if (hasActions) {
            return { isValid: true };
        }

        const errors = [];
        !hasActions && !hasLabels && errors.push('labels');
        !hasActions && !hasMark && errors.push('mark');
        !hasActions && !hasMove && errors.push('move');
        !hasActions && !hasVacation && isPaidUser && errors.push('vacation');

        return {
            isValid: false,
            errors
        };
    }

    function simpleValidator({ Actions = {}, Conditions = [] }) {
        return {
            actions: validateActions(Actions),
            conditions: validateConditions(Conditions)
        };
    }

    async function validator({ Simple, Name = '', Sieve = '' }) {
        const errors = {
            name: { isValid: !!Name.length }
        };

        if (Object.keys(Simple || {}).length) {
            Object.assign(errors, simpleValidator(Simple));
        }

        const sieveCode = Sieve || '';
        if (sieveCode) {
            const errors = await sieveLint.run(sieveCode);
            errors.sieve = {
                isValid: !!errors.length,
                errors
            };
        }

        return {
            valid: Object.keys(errors).every((key) => errors[key].isValid),
            errors
        };
    }

    return validator;
}
export default filterValidator;
