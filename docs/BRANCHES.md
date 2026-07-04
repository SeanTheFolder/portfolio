# Branch history and breadcrumbs

This file records working branches that were merged and removed, so their
history can be traced by commit id without keeping stale refs around.
Dates are the day the branch was retired.

## Removed working branches (2026-07-04)

### keen-davinci (rebuild branch)
Working branch for the full site rebuild (the "Field Report" design system:
single stylesheet, self-hosted Fraunces / Instrument Sans / JetBrains Mono,
command palette, regenerated case studies and essays) plus the follow-up
refinement pass (process component, prose cleanup, new og-image, llms.txt).
Fully merged into `main`; the branch tip was identical to `main` at removal
(`fe12758` at the time).

### stoic-hypatia (llms.txt draft)
Carried a single commit adding the first `llms.txt` site synopsis
(tip `28e8ba8`, parented on the pre-rebuild history at `f1108a8`). The
synopsis was adopted into `main` in updated form to describe the rebuilt
site, in the commit "Add llms.txt synopsis, updated for the rebuilt site".

### loving-bardeen (pre-rebuild pointer)
Pointed at the final pre-rebuild site (`f1108a8`, "Stagger card-grid reveal
animations for cascading entrance"). That history remains fully reachable:
`v2-main` points at the same commit, and it is an ancestor of `main`.

### setup-branching-strategy (design-system pointer)
Pointed at the design-system modernization commit (`914f210`, "Modernize
design system: tokens, WCAG 2.2 AA, OS-aware theme"). The `backup` branch
points at the same commit, and it is an ancestor of `main`.

## Long-lived branches

- `main`: the live source of seanwelding.com.
- `live`: deploy pointer, kept in sync with `main`.
- `backup`: frozen at the pre-rebuild design-system snapshot (`914f210`).
- `v2-main`: frozen at the final pre-rebuild site (`f1108a8`), kept for
  reference and comparison with the rebuild.
- `main-1` through `main-11`: historical snapshots of earlier site
  iterations, oldest first. `main-1` is the original upload and has
  standalone history.
