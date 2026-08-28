# Install and uninstall procedure

Realization: `dsh-warm-minimal-linux-web@0.1.0-candidate.6`

Implementation identity: `dsh-warm-minimal` commit `980a8891cec72830b292a5c4f5d4103d6dea238e`.

Normal install:

```bash
cd /root/dsh-warm-minimal
bash scripts/setup.sh
systemctl restart dsh-web
```

Uninstall:

```bash
cd /root/dsh-warm-minimal
bash scripts/uninstall.sh
systemctl restart dsh-web
```

The setup and uninstall scripts own only the marked user preset and the profile's plugin registration. Candidate.6 edits no DeepSeek Harness source and requires no host rebuild: the bundle is linked from `/root/dsh-warm-minimal`, and the running service only needs a restart to load the updated `index.mjs`.
