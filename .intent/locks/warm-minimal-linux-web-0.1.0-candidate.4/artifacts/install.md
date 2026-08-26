# Install and uninstall procedure

Realization: `deepseek-harness-warmup-projection@0.1.0-candidate.4`

Target baseline: DeepSeek Harness `b642a10626a950cc95c2d6f839810cb01fe599fe`.

Implementation identity: `dsh-warm-minimal` commit `2809158c299643cd47c0c1bc2b3ffbdc0bd9b95c`.

Production install:

```bash
cd /root/dsh-warm-minimal
DSH_REPO=/root/deepseek-harness bash scripts/setup.sh
cd /root/deepseek-harness
pnpm run build
systemctl restart dsh-web
```

Candidate validation applies `realization/deepseek-harness-regression.patch` only while running the focused Trajectory test, then reverses it. That validation patch is retained by the package but is not part of production installation.

Uninstall:

```bash
cd /root/dsh-warm-minimal
DSH_REPO=/root/deepseek-harness bash scripts/uninstall.sh
cd /root/deepseek-harness
pnpm run build
systemctl restart dsh-web
```

The host lifecycle receipt binds the production patch digest, baseline, repository, and exact owned paths. Same-hunk drift or preset drift stops mutation; unrelated Harness worktree changes remain outside package ownership.
