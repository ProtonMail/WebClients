import type { GatewayLogical } from '../../types/Gateway';

export const isLogicalDeleted = (logical: GatewayLogical) => !logical.Visible && logical.Servers?.length > 0;
