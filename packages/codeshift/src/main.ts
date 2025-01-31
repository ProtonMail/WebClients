import { transform as transformPaymentsCycle } from './payments/cycle';

async function main() {
    await transformPaymentsCycle();
}

main().catch(console.error);
