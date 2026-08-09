# Hello PCL fixture

End-to-end fixture for Community Edition M1:

```bash
node ../../tools/pnp-community-cli/bin/pnp.js build
node ../../tools/pnp-community-cli/bin/pnp.js sign
node ../../tools/pnp-community-cli/bin/pnp.js package
node ../../tools/pnp-community-cli/bin/pnp.js validate
```

Produces `dist/com.pcln.hello-pcl-0.1.0.pnp` after a successful run.
