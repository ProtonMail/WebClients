import type { SecurityCheckupAction } from '@proton/shared/lib/interfaces/securityCheckup';
import type { SecurityCheckupCohortType } from '@proton/shared/lib/interfaces/securityCheckup/SecurityCheckupCohort';

interface SecurityCheckupHealth {
    cohort: SecurityCheckupCohortType;
    actions: SecurityCheckupAction[];
    furtherActions: SecurityCheckupAction[];
}
export default SecurityCheckupHealth;
