# Install and uninstall procedure

Realization: `deepseek-harness-warmup-projection@0.1.0-candidate.1`

Target baseline: DeepSeek Harness `b642a10626a950cc95c2d6f839810cb01fe599fe`.

Implementation identity: `dsh-warm-minimal` commit `a46bf4394ac8ed054f599dfddd48eb662b5e4377`.

Install on the current Linux Web target:

```bash
cd /root/dsh-warm-minimal
DSH_REPO=/root/deepseek-harness \
DSH_WARM_ADOPT_HOST_PATCH=1 \
DSH_WARM_ADOPT_PRESET=1 \
bash scripts/setup.sh
cd /root/deepseek-harness
pnpm run build
systemctl restart dsh-web
```

The two adoption flags are migration-only: the current checkout and preset contain byte-matching effects from the prior untracked installation. Fresh installs omit them.

Uninstall:

```bash
cd /root/dsh-warm-minimal
DSH_REPO=/root/deepseek-harness bash scripts/uninstall.sh
cd /root/deepseek-harness
pnpm run build
systemctl restart dsh-web
```

The host lifecycle command stores its receipt below the target repository's Git directory. Uninstall requires a matching receipt and a clean reverse-patch check. Same-hunk drift or preset drift stops before those owned files are removed; unrelated Harness worktree changes are outside the manifest.
