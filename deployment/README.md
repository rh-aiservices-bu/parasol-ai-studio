# Deployment recipe

- Create the Secret:

```bash
oc -n redhat-ods-applications create secret generic myaistudio-proxy --from-literal=session_secret=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c43)
```

- Create the SA from `sa.yaml`.
- Create the RBs from `role-binding.yaml`.
- Modify `oauthclient.yaml` with the secret you get from Secret `dashboard-oauth-client-generated` (to reuse the already existing resource). Create the OAuthClient from the file.
- Create Deployment, Service and Route from the respective files.
