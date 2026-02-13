# Calendar Deployments

Calendar has 3 deployments (environments): `Alpha`, `Beta` and `Live`.

## Part 1 - Docker

When creating a new Git release tag the CI takes care of building the static assets and bake a Docker image with the same version number.

For example, for the Git tag `proton-calendar@5.0.100.1` the Docker image tag will be `v5.0.100.1`.

All the user facing docker images are hosted in `Harbor` and they're available in the [proton-calendar/prod](https://harbor.protontech.ch/harbor/projects/15/repositories/proton-calendar%2Fprod/artifacts-tab).

NOTE: Not to be confused with the [proton-calendar](https://harbor.protontech.ch/harbor/projects/15/repositories/proton-calendar/artifacts-tab) or [proton-calendar/dev](https://harbor.protontech.ch/harbor/projects/15/repositories/proton-calendar%2Fdev/artifacts-tab) which are used for CI deployments.

## Part 2 - Kubernetes

Kubernetes (K8s) definitions specify which Docker image should be deployed to which pods, assigning also the amount of resources to be used by each pod (CPUs, Memory, etc), together with additional configurations for security certificates, rollout strategies and so on.

- K8s stack for [Alpha](https://gitlab.protontech.ch/kubernetes/stacks/inbox/-/tree/main/frontend-calendar-alpha?ref_type=heads)
- K8s stack for [Beta](https://gitlab.protontech.ch/kubernetes/stacks/inbox/-/tree/main/frontend-calendar-beta?ref_type=heads)
- K8s stack for [Live](https://gitlab.protontech.ch/kubernetes/stacks/inbox/-/tree/main/frontend-calendar-live?ref_type=heads)

## Part 3 - ArgoCD

ArgoCD takes care of orchestrating the deployment process, promoting a new Docker image version to a specific environment.

Each deployment is defined as an `Application` in ArgoCD, the UI helps understanding how many pods are running for a give env and which Docker image is used by the pods.

- ArgoCD application for [Alpha](https://argocd-kwebapizur2.protontech.ch/applications/argocd/frontend-calendar-alpha?view=tree&orphaned=false&resource=)
- ArgoCD application for [Beta](https://argocd-kwebapizur2.protontech.ch/applications/argocd/frontend-calendar-beta?view=tree&orphaned=false&resource=)
- ArgoCD application for [Live](https://argocd-kwebapizur2.protontech.ch/applications/argocd/frontend-calendar-live?view=tree&orphaned=false&resource=)

## Part 4 - Argo Rollout

As the name suggests, Argo Rollout focuses on the rollout process of a new deployment, the current strategy used is `Canary`. `Canary` means that 1 pod will be created with the new version to deploy, real traffic will be sent to the pod, then the checks defined in the rollout strategy will be performed to establish if the pod is `Healthy`. If the canary pod is healthy the scaling strategy proceeds by having as many new pods as many were present in the previous version, move all the traffic to the new pods and, at last, remove all the pods with the previous version.

Argo rollout provides also the capability of rolling back to any previous version, without having to change any code.

- Argo Rollout for [Alpha](https://rollouts-kwebapifra1.protontech.ch/rollouts/rollout/inbox-frontend-calendar-alpha/frontend-calendar-alpha-apache)
- Argo Rollout for [Beta](https://rollouts-kwebapifra1.protontech.ch/rollouts/rollout/inbox-frontend-calendar-beta/frontend-calendar-beta-apache)
- Argo Rollout for [Live](https://rollouts-kwebapifra1.protontech.ch/rollouts/rollout/inbox-frontend-calendar-live/frontend-calendar-live-apache)

## Part 5 - Grafana

Metrics about the state of the pods, rollout, and the currently used image version can be found on Grafana:

- Metrics for [Alpha](https://grafana.protontech.ch/d/5c6f01b4-165a-4f79-89fe-f30cdc21c35f/frontend-calendar-progressive-rollout?orgId=1&from=now-30m&to=now&timezone=utc&var-loki=ljxMVk7Vz&var-prometheus=fcc09d1e-3027-4eb1-bb91-e2e097f4415b&var-cluster=$__all&var-env=alpha&var-namespace=inbox-frontend-calendar-alpha&var-pod=$__all&var-search=&refresh=10s&editIndex=2)
- Metrics for [Beta](https://grafana.protontech.ch/d/5c6f01b4-165a-4f79-89fe-f30cdc21c35f/frontend-calendar-progressive-rollout?orgId=1&from=now-30m&to=now&timezone=utc&var-loki=ljxMVk7Vz&var-prometheus=fcc09d1e-3027-4eb1-bb91-e2e097f4415b&var-cluster=$__all&var-env=beta&var-namespace=inbox-frontend-calendar-beta&var-pod=$__all&var-search=&refresh=10s&editIndex=2)
- Metrics for [Live](https://grafana.protontech.ch/d/5c6f01b4-165a-4f79-89fe-f30cdc21c35f/frontend-calendar-progressive-rollout?orgId=1&from=now-30m&to=now&timezone=utc&var-loki=ljxMVk7Vz&var-prometheus=fcc09d1e-3027-4eb1-bb91-e2e097f4415b&var-cluster=$__all&var-env=live&var-namespace=inbox-frontend-calendar-live&var-pod=$__all&var-search=&refresh=10s&editIndex=2)
