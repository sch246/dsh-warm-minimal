# Candidate acceptance evidence

Observed on 2026-08-26 before live deployment:

- Candidate.4's owned Harness compatibility patch was removed through its receipt-aware uninstaller. All five formerly owned Harness paths returned to their Git baseline with no remaining diff, and the ownership receipt was removed.
- The replacement contributes no Harness patch, realization manifest, patch lifecycle script, or Harness-specific regression patch.
- `npm test` passes 6/6 checks covering synchronous first-input hold, native marked bootstrap, ordered restoration of concurrent inputs, failure restoration, effective runtime preset scope, later-turn idempotence, non-user exclusion, and minimal composition.
- `presets/warm-minimal/agent.cordis.yml` is byte-for-byte equal to the target Harness official `minimal` preset composition.
- Target inspection confirms that persistent bash reads `owner.session.header.cwd` and passes it to `terminals.spawn`; the backend uses that value as the subprocess cwd. Workspace confirmation therefore comes from the current session through the real shell.
- The bootstrap message carries native `{ kind: 'user' }` provenance and a durable `dsh-warm-minimal:bootstrap:` ID prefix. No plugin code appends session events or constructs assistant/tool messages.
- `npm pack --dry-run` succeeds and includes neither donor transcript data nor a Harness realization patch.
- Implementation identity is Git commit `b1b61a25afc44401a705e05c15713ec56d2b3d1a`.

Live deployment evidence on 2026-08-26:

- The installed web-profile dependency remains `link:/root/dsh-warm-minimal`, and the package-owned installed preset remains byte-for-byte equal to official minimal.
- A full Harness host, client, and web-frontend build completed after candidate.4's patch removal.
- `dsh-web` restarted successfully, reports `active`, listens on `127.0.0.1:3082`, and serves the production HTML.
- All five formerly patched Harness paths have no Git diff and no host-patch ownership receipt remains.

Still required before acceptance:

- In a new warm-minimal session, observe the native bootstrap followed by the original request in ordinary Chat and Trajectory, with one exact system sentence, exactly two Linux tools, no extra contexts, and the current session workspace.
- Exercise clean package uninstall/reinstall or otherwise obtain equivalent ownership evidence.
- Obtain explicit user acceptance.
