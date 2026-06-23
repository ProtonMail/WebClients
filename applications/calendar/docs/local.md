# How to run Calendar locally

## Run only Calendar

`yarn start-all --applications "proton-calendar"`

## Run Account and Calendar together

`yarn start-all --applications "proton-account proton-calendar"`

## Run Account, Calendar and Mail together

`yarn start-all --applications "proton-account proton-calendar proton-mail"`

## Target a canonical API env

Pink: `yarn start-all --applications "proton-calendar" --api proton.pink`

Black: `yarn start-all --applications "proton-calendar" --api proton.black`

## Target a scientist API env

Open a MR with the expected labels to trigger a scientist env deployment.

Once the env is ready, prepend the scientist name to the api

Example with `Fermi`:

`yarn start-all --applications "proton-calendar" --api fermi.proton.black`

`yarn start-all --applications "proton-calendar" --api fermi.proton.pink`
