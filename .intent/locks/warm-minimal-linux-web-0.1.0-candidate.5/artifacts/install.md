# Install and uninstall procedure

Realization: `dsh-warm-minimal-linux-web@0.1.0-candidate.5`

Implementation identity: `dsh-warm-minimal` commit `b1b61a25afc44401a705e05c15713ec56d2b3d1a`.

Normal install:

```bash
cd /root/dsh-warm-minimal
bash scripts/setup.sh
systemctl restart dsh-web
```

Migration from candidate.4 additionally requires one Harness rebuild after its receipt-aware host-patch uninstall, because the running web assets may still contain the removed compatibility code:

```bash
cd /root/deepseek-harness
pnpm run build
systemctl restart dsh-web
```

Uninstall:

```bash
cd /root/dsh-warm-minimal
bash scripts/uninstall.sh
systemctl restart dsh-web
```

The setup and uninstall scripts own only the marked user preset and the profile's plugin registration. Candidate.5 never edits, patches, commits, forks, or records an ownership receipt inside the Harness checkout. Preset drift stops replacement or removal; unrelated Harness source, sessions, profile entries, and repository history remain outside package ownership.
