import type { State } from '../types';

export const selectOrganizationSettings = ({ organizationSettings }: State) => organizationSettings;
export const selectOrganizationShareMode = ({ organizationSettings }: State) => organizationSettings?.shareMode;
export const selectOrganizationExportMode = ({ organizationSettings }: State) => organizationSettings?.exportMode;
