# Deployment recipe

- Create the Secret:

```bash
oc -n redhat-ods-applications create secret generic myaistudio-proxy --from-literal=session_secret=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c43)
```

- Create the SA from `sa.yaml`.
- Create the RBs from `role-binding.yaml`.
- Modify `oauthclient.yaml` with the secret you get from Secret `dashboard-oauth-client-generated` (to reuse the already existing resource). Create the OAuthClient from the file.
- Edit the Deployment file and replace the env values or you MaaS endpoint. You will need a 3Scale API account with enough rights, and get the Plan IDs of the Products/Models you are serving.

- Create a secret to include the following environment variables got from the MaaS deployment:
    - MAAS_API_URL
    - MAAS_API_KEY
    - MAAS_ANYLLM_PLAN_ID
    - MAAS_CODE_PLAN_ID
    - MAAS_SDXL_PLAN_ID
    - MAAS_DOCLING_PLAN_ID
    - MAAS_GUARD_PLAN_ID
    - MAAS_SAFETY_PLAN_ID

  You will need a 3Scale API account with enough rights, and get the Plan IDs of the Products/Models you are serving.
```bash
oc create secret generic my-ai-studio-secret \
--from-literal=MAAS_API_URL=https://${ADMIN_HOST} \
--from-literal=MAAS_API_KEY=${ACCESS_TOKEN} \
--from-literal=MAAS_ANYLLM_PLAN_ID=${MAAS_ANYLLM_PLAN_ID} \
--from-literal=MAAS_CODE_PLAN_ID=${MAAS_CODE_PLAN_ID} \
--from-literal=MAAS_SDXL_PLAN_ID= \
--from-literal=MAAS_DOCLING_PLAN_ID=${MAAS_DOCLING_PLAN_ID} \
--from-literal=MAAS_GUARD_PLAN_ID= \
--from-literal=MAAS_SAFETY_PLAN_ID=
```
- Create Deployment, Service and Route from the respective files.
- Create the custom workbenches from `imagestreams.yaml`
