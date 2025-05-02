# Deployment recipe

- Create the Secret:

```bash
oc -n redhat-ods-applications create secret generic myaistudio-proxy --from-literal=session_secret=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c43)
```

- Create the SA from `sa.yaml`.
- Create the RBs from `role-binding.yaml`.
- Modify `oauthclient.yaml` with the secret you get from Secret `dashboard-oauth-client-generated` (to reuse the already existing resource). Create the OAuthClient from the file.
- Edit the Deployment file and replace the env values or you MaaS endpoint. You will need a 3Scale API account with enough rights, and get the Plan IDs of the Products/Models you are serving.
- Create Deployment, Service and Route from the respective files.
- Create the custom workbenches from `imagestreams.yaml`
