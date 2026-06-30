import type { MspCompany } from '../types';

const MOCK_COMPANIES: MspCompany[] = [
    { id: 'acme', name: 'Acme', assignedSeats: 80, usedSeats: 67, status: 'active' },
    { id: 'beta-maximum-org', name: 'Beta Maximum Org', assignedSeats: 20, usedSeats: 20, status: 'disabled' },
    { id: 'delta-innovations', name: 'Delta Innovations', assignedSeats: 15, usedSeats: 15, status: 'active' },
    { id: 'epsilon-solutions', name: 'Epsilon Solutions', assignedSeats: 40, usedSeats: 33, status: 'active' },
    { id: 'eta-logistics', name: 'Eta Logistics', assignedSeats: 100, usedSeats: 70, status: 'active' },
    { id: 'gamma-tech', name: 'Gamma Tech', assignedSeats: 100, usedSeats: 50, status: 'active' },
    { id: 'iota-financial', name: 'Iota Financial', assignedSeats: 120, usedSeats: 90, status: 'active' },
    { id: 'kappa-media', name: 'Kappa Media', assignedSeats: 10, usedSeats: 7, status: 'disabled' },
    { id: 'lambda-designs', name: 'Lambda Designs', assignedSeats: 50, usedSeats: 45, status: 'active' },
    { id: 'mu-technologies', name: 'Mu Technologies', assignedSeats: 80, usedSeats: 80, status: 'active' },
    { id: 'nu-health', name: 'Nu Health', assignedSeats: 30, usedSeats: 30, status: 'disabled' },
    { id: 'omicron-ventures', name: 'Omicron Ventures', assignedSeats: 15, usedSeats: 12, status: 'active' },
    { id: 'pi-creative', name: 'Pi Creative', assignedSeats: 60, usedSeats: 55, status: 'active' },
    { id: 'rho-enterprises', name: 'Rho Enterprises', assignedSeats: 50, usedSeats: 37, status: 'active' },
    { id: 'sigma-group', name: 'Sigma Group', assignedSeats: 45, usedSeats: 38, status: 'active' },
    { id: 'tau-systems', name: 'Tau Systems', assignedSeats: 35, usedSeats: 28, status: 'active' },
    { id: 'theta-corporation', name: 'Theta Corporation', assignedSeats: 25, usedSeats: 25, status: 'active' },
];

export default MOCK_COMPANIES;
