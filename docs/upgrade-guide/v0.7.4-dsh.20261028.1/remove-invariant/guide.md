---
kind: upgrade-guide
description: The obsolete dsh-at-file/invariant entry point is removed with the Harness invariant registry.
---

# Remove the invariant companion

## Change

Harness has removed the runtime invariant registry. The optional `dsh-at-file/invariant` entry point and its SDK dependency are removed; normal Host and client entries keep their registration and disposal behavior.

## Migration

1. Remove any `dsh-at-file/invariant` row from `cordis.yml` and profile patches, and delete imports of that subpath.
2. Load the normal `dsh-at-file` bundle and confirm the @path picker still opens and inserts a file reference. Existing picker settings and workspace files require no migration.
