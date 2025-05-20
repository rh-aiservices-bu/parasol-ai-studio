import { XMLParser } from 'fast-xml-parser';
import { KubeFastifyInstance } from '../../../types';
import {
  MAAS_API_KEY,
  MAAS_API_URL,
  MAAS_DOCLING_PLAN_ID,
  MAAS_ANYLLM_PLAN_ID,
  MAAS_CODE_PLAN_ID,
  MAAS_SDXL_PLAN_ID,
  MAAS_GUARD_PLAN_ID,
  MAAS_SAFETY_PLAN_ID,
} from '../../../utils/constants';

interface Application {
  id: any;
  name: string;
  user_key: string;
}

interface ApplicationPlan {
  id: string;
  service_id: string;
}

const SERVICE_PLAN_MAP = {
  anyllm: MAAS_ANYLLM_PLAN_ID,
  code: MAAS_CODE_PLAN_ID,
  sdxl: MAAS_SDXL_PLAN_ID,
  docling: MAAS_DOCLING_PLAN_ID,
  guard: MAAS_GUARD_PLAN_ID,
  safety: MAAS_SAFETY_PLAN_ID,
} as const;

export const helloMaas = (fastify: KubeFastifyInstance): Promise<{ message: string }> => {
  fastify.log.info('Hello from maas');
  const response = { message: 'Hello from maas' };

  return Promise.resolve(response);
};

/**
 * Checks if a Maas user exists by querying the Maas API.
 *
 * @param request - The Fastify request object containing the parameters.
 * @returns A promise that resolves to an object containing a message with the account ID if found, or '-1' if not found.
 * @throws Will throw an error if the fetch request fails.
 */
export const checkOrCreateMaasUser = async (
  fastify: KubeFastifyInstance,
  user_name: string,
): Promise<{ message: string }> => {
  const url = new URL(MAAS_API_URL + '/admin/api/accounts/find.xml');
  const urlParams = new URLSearchParams();
  urlParams.append('access_token', MAAS_API_KEY);
  urlParams.append('username', user_name);

  try {
    const response = await fetch(`${url}?${urlParams}`, {
      method: 'GET',
      headers: {
        Accept: '*/*',
      },
    });

    if (response.ok) {
      const parser = new XMLParser();
      const data = await response.text(); // since it's XML
      const jsonObj = parser.parse(data);
      const accountId = jsonObj?.account?.id || '-1';
      return { message: accountId };
    } else if (response.status === 404) {
      // If user does not exist, create it
      try {
        const signupUrl = new URL(MAAS_API_URL + '/admin/api/signup.xml');
        const body = new FormData();
        const random_password = Array.from({ length: 16 }, () =>
          Math.floor(Math.random() * 10),
        ).join('');
        body.set('access_token', MAAS_API_KEY);
        body.set('org_name', user_name);
        body.set('username', user_name);
        body.set('email', user_name);
        body.set('password', random_password);
        const response = await fetch(signupUrl, {
          method: 'POST',
          headers: {
            Accept: '*/*',
          },
          body,
        });
        if (response.ok) {
          const parser = new XMLParser();
          const data = await response.text(); // since it's XML
          const jsonObj = parser.parse(data);
          const accountId = Array.isArray(jsonObj?.account?.users?.user)
            ? jsonObj.account.users.user[0]?.account_id || '-1'
            : jsonObj?.account.users?.user?.account_id || '-1';
          return { message: accountId };
        }
      } catch (e) {
        console.error(e);
        //throw e; // Re-throw the error to be handled by the caller
      }
    }
  } catch (e) {
    console.error(e);
    //throw e; // Re-throw the error to be handled by the caller
  }
};

/**
 * Checks if a Maas application exists, and creates it if it does not.
 *
 * @param fastify - The Fastify instance.
 * @param user_name - The name of the user.
 * @param app_name - The name of the application.
 * @param service_name - The name of the service.
 * @returns A promise that resolves to an object containing a message indicating the result.
 * @throws Will throw an error if the fetch request fails.
 */
export const checkOrCreateMaasApplication = async (
  fastify: KubeFastifyInstance,
  user_name: string,
  app_name: string,
  service_name: string,
): Promise<{ message: string }> => {
  // Check if user exists
  fastify.log.info(`Retrieving of creating id for ${user_name}`);
  let user_id = '-1';
  try {
    const userResponse = await checkOrCreateMaasUser(fastify, user_name);
    user_id = userResponse.message;
  } catch (e) {
    fastify.log.error(e);
    throw e; // Re-throw the error to be handled by the caller
  }
  if (user_id === '-1') {
    fastify.log.error('Failed to create or find MaaS user');
    return { message: user_id };
  }

  const url = new URL(MAAS_API_URL + '/admin/api/accounts/' + user_id + '/applications.xml');
  const urlParams = new URLSearchParams();
  urlParams.append('access_token', MAAS_API_KEY);

  try {
    const response = await fetch(`${url}?${urlParams}`, {
      method: 'GET',
      headers: {
        Accept: '*/*',
      },
    });
    if (response.ok) {
      let userKey = '-1';
      const parser = new XMLParser();
      const data = await response.text(); // since it's XML
      const jsonObj = parser.parse(data);
      fastify.log.debug(jsonObj);
      let applications = [];
      // Find all application blocks
      if (jsonObj.applications !== '') {
        applications = Array.isArray(jsonObj?.applications?.application)
          ? jsonObj.applications.application
          : [jsonObj.applications.application];
      }
      // Find if application already exists, return the user_key if found
      let matchingApp: Application | undefined;
      fastify.log.debug(`Applications: ${applications}`);
      if (applications.length > 0) {
        matchingApp = applications.find((app: Application) => app.name === app_name);
      }
      if (matchingApp?.user_key) {
        userKey = matchingApp.user_key;
      } else {
        // If application does not exist, create it and return the user_key
        try {
          const body = new FormData();
          body.set('access_token', MAAS_API_KEY);
          body.set('name', app_name);
          const planId = SERVICE_PLAN_MAP[service_name as keyof typeof SERVICE_PLAN_MAP];
          if (!planId) {
            throw new Error('Invalid service name');
          }
          body.set('plan_id', planId);
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              Accept: '*/*',
            },
            body,
          });
          if (response.ok) {
            const parser = new XMLParser();
            const data = await response.text(); // since it's XML
            const jsonObj = parser.parse(data);
            userKey = jsonObj?.application?.user_key || '-1';
          }
        } catch (e) {
          console.error(e);
          fastify.log.debug('User ID:', user_id);
          throw e; // Re-throw the error to be handled by the caller
        }
      }
      return { message: userKey };
    } else if (response.status === 404) {
      return { message: '-1' };
    }
  } catch (e) {
    console.error(e);
    fastify.log.debug('User ID:', user_id);
    throw e; // Re-throw the error to be handled by the caller
  }
};

/**
 * Deletes a Maas application by querying the Maas API.
 *
 * @param fastify - The Fastify instance.
 * @param user_name - The name of the user.
 * @param app_name - The name of the application.
 * @returns A promise that resolves to an object containing a message indicating the result.
 * @throws Will throw an error if the fetch request fails.
 */
export const deleteMaasApplication = async (
  fastify: KubeFastifyInstance,
  user_name: string,
  app_name: string,
): Promise<{ message: string }> => {
  // Check if user exists
  fastify.log.info(`Retrieving id for ${user_name}`);
  let user_id = '-1';
  try {
    const userResponse = await checkOrCreateMaasUser(fastify, user_name);
    user_id = userResponse.message;
  } catch (e) {
    fastify.log.error(e);
    throw e; // Re-throw the error to be handled by the caller
  }
  if (user_id === '-1') {
    fastify.log.error('Failed to find MaaS user');
    return { message: 'user not found' };
  }

  const url = new URL(MAAS_API_URL + '/admin/api/accounts/' + user_id + '/applications.xml');
  const urlParams = new URLSearchParams();
  urlParams.append('access_token', MAAS_API_KEY);

  try {
    const response = await fetch(`${url}?${urlParams}`, {
      method: 'GET',
      headers: {
        Accept: '*/*',
      },
    });
    if (response.ok) {
      const parser = new XMLParser();
      const data = await response.text(); // since it's XML
      const jsonObj = parser.parse(data);
      fastify.log.debug(jsonObj);
      let applications = [];
      // Find all application blocks
      if (jsonObj.applications !== '') {
        applications = Array.isArray(jsonObj?.applications?.application)
          ? jsonObj.applications.application
          : [jsonObj.applications.application];
      }
      // Find if application exists
      let matchingApp: Application | undefined;
      fastify.log.debug(`Applications: ${applications}`);
      if (applications.length > 0) {
        matchingApp = applications.find((app: Application) => app.name === app_name);
      }
      if (!matchingApp) {
        return { message: 'Application not found' };
      } else {
        // If application exists, delete it
        const deleteUrl = new URL(
          MAAS_API_URL + `/admin/api/accounts/${user_id}/applications/${matchingApp.id}.xml`,
        );
        try {
          const deleteResponse = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
              Accept: '*/*',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: urlParams,
          });
          if (deleteResponse.ok) {
            return { message: 'Application deleted' };
          } else {
            throw new Error('Failed to delete application');
          }
        } catch (e) {
          console.error(e);
          fastify.log.debug('User ID:', user_id);
          throw e; // Re-throw the error to be handled by the caller
        }
      }
    } else if (response.status === 404) {
      return { message: 'Application not found' };
    }
  } catch (e) {
    console.error(e);
    fastify.log.debug('User ID:', user_id);
    throw e; // Re-throw the error to be handled by the caller
  }
};


/**
 * Get the gateway endpoint for the application plan
 *
 * @param fastify - The Fastify instance.
 * @param service_name - The name of the service.
 * @returns A promise that resolves to an object containing a message indicating the result.
 * @throws Will throw an error if the fetch request fails.
 */
export const getMaasApplicationPlanEndpoint = async (
  fastify: KubeFastifyInstance,
  service_name: string,
): Promise<{ message: string }> => {
  // Check if user exists
  const planId = SERVICE_PLAN_MAP[service_name as keyof typeof SERVICE_PLAN_MAP];

  fastify.log.info(`Retrieving of gateway config for ${service_name} (${planId})`);

  const url = new URL(MAAS_API_URL + '/admin/api/application_plans.xml');
  const urlParams = new URLSearchParams();
  urlParams.append('access_token', MAAS_API_KEY);

  try {
    const response = await fetch(`${url}?${urlParams}`, {
      method: 'GET',
      headers: {
        Accept: '*/*',
      },
    });

    if (response.ok) {
      const parser = new XMLParser();
      var data = await response.text();
      let jsonObj = parser.parse(data);

      // Find if application exists
      let matchingPlan: ApplicationPlan | undefined;

      let plans = [];
      // Find all application blocks
      if (jsonObj.plans !== '') {
        plans = Array.isArray(jsonObj?.plans?.plan)
          ? jsonObj.plans.plan
          : [jsonObj.plans.plan];
      }
      
      if (plans.length > 0) {
        matchingPlan = plans.find((plan: ApplicationPlan) => plan.id == planId);
      }

      if (!matchingPlan) {
        return { message: 'ApplicationPlan not found' };
      } else {
        const gatewayConfigUrl = new URL(MAAS_API_URL + '/admin/api/services/' + matchingPlan.service_id + '/proxy.xml');
        const gatewayConfigUrlParams = new URLSearchParams();
        gatewayConfigUrlParams.append('access_token', MAAS_API_KEY);

        try {
          const gatewayConfigResponse = await fetch(`${gatewayConfigUrl}?${gatewayConfigUrlParams}`, {
            method: 'GET',
            headers: {
              Accept: '*/*',
            },
          });

          if (gatewayConfigResponse.ok) {
            let endpoint = '';
            data = await gatewayConfigResponse.text();
            jsonObj = parser.parse(data);

            fastify.log.info(jsonObj);

            endpoint = jsonObj?.proxy?.endpoint;

            return { message: endpoint };
          }
        } catch (e) {
          console.error(e);
          fastify.log.debug('Service Name:', service_name);
          throw e; // Re-throw the error to be handled by the caller
        }
      }
    }
  } catch (e) {
    console.error(e);
    fastify.log.debug('Service Name:', service_name);
    throw e; // Re-throw the error to be handled by the caller
  }
};