# How to run Calendar locally

## Run only Calendar

`pnpm run start-all --applications "proton-calendar"`

## Run Account and Calendar together

`pnpm run start-all --applications "proton-account proton-calendar"`

## Run Account, Calendar and Mail together

`pnpm run start-all --applications "proton-account proton-calendar proton-mail"`

## Target a canonical API env

Pink: `pnpm run start-all --applications "proton-calendar" --api proton.pink`

Black: `pnpm run start-all --applications "proton-calendar" --api proton.black`

## Target a scientist API env

Open a MR with the expected labels to trigger a scientist env deployment.

Once the env is ready, prepend the scientist name to the api

Example with `Fermi`:

`pnpm run start-all --applications "proton-calendar" --api fermi.proton.black`

`pnpm run start-all --applications "proton-calendar" --api fermi.proton.pink`
