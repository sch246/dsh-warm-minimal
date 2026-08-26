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

Still required before acceptance:

- Install candidate.5 into the live web profile, rebuild once to remove candidate.4's previously compiled host patch, restart `dsh-web`, and verify service health.
- In a new warm-minimal session, observe the native bootstrap followed by the original request in ordinary Chat and Trajectory, with one exact system sentence, exactly two Linux tools, no extra contexts, and the current session workspace.
- Exercise clean package uninstall/reinstall or otherwise obtain equivalent ownership evidence.
- Obtain explicit user acceptance.
