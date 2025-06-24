import { XMLParser } from 'fast-xml-parser';
import { KubeFastifyInstance } from '../../../types';
import {
  MAAS_API_KEY,
  MAAS_API_URL,
  VECTOR_DB,
  WEAVIATE_ENDPOINT,
  QDRANT_ENDPOINT,
  GUARD_ENABLED,
  SAFETY_ENABLED,
} from '../../../utils/constants';

interface Application {
  id: any;
  name: string;
  user_key: string;
}

interface ApplicationPlan {
  id: number;
  service_id: string;
}

interface Feature {
  id: number;
  name: string;
  visible: boolean;
}

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
 * Get Maas application plan ID for service_name, and creates it if it does not.
 *
 * @param fastify - The Fastify instance.
 * @param service_name - The name of the service.
 * @returns A promise that resolves to an object containing a message indicating the result.
 * @throws Will throw an error if the fetch request fails.
 */
export const getMaasApplicationPlan = async (
  fastify: KubeFastifyInstance,
  service_name: string,
): Promise<{ message: string }> => {
  console.info(`Retrieving of application plan id for service ` + service_name);

  var url = new URL(MAAS_API_URL + '/admin/api/application_plans.xml');
  const urlParams = new URLSearchParams();
  urlParams.append('access_token', MAAS_API_KEY);

  const parser = new XMLParser();

  try {
    var response = await fetch(`${url}?${urlParams}`, {
      method: 'GET',
      headers: {
        Accept: '*/*',
      },
    });
    if (response.ok) {
      var data = await response.text(); // since it's XML
      var jsonObj = parser.parse(data);
      
      let plans = [];
      if (jsonObj.plans !== '') {
        plans = Array.isArray(jsonObj?.plans?.plan)
          ? jsonObj.plans.plan
          : [jsonObj.plans.plan];
      }

      // Find if application plan that has the feature set with the service_name
      var matchingAppPlans : ApplicationPlan[] = [];
      console.debug("Application Plans: " + JSON.stringify(plans));
      
      if (plans.length > 0) {
        const promises: ApplicationPlan[] = plans.map((plan: ApplicationPlan) => {
          return getMaasApplicationPlanFeatures(fastify, plan.id).then((message) => { 
            jsonObj = parser.parse(message.message);

            let features = [];
            if (jsonObj.features !== '') {
              features = Array.isArray(jsonObj?.features?.feature)
              ? jsonObj.features.feature
              : [jsonObj.features.feature];

              console.info("Features for Application Plan " + plan.id + ": " + JSON.stringify(features));

              if (features.filter((feature: Feature) => feature.name == service_name && feature.visible).length > 0) {
                console.info("Returning matching plan " + JSON.stringify(plan));
                return plan;
              }
            }
          });
        })

        const result = await Promise.all(promises);
        console.info("Processed all application plans");

        matchingAppPlans = result.filter(function(e) { return e});
      }

      console.info("Matching Application Plans " + JSON.stringify(matchingAppPlans));
      console.info("Matching Application Plan " + matchingAppPlans[0].id);
      return { message: matchingAppPlans[0].id.toString() };
    }
  } catch (e) {
    console.error(e);
    fastify.log.debug('Service Name:', service_name);
    throw e; // Re-throw the error to be handled by the caller
  }
};

/**
 * Get Maas application plan features for Application Plan
 *
 * @param fastify - The Fastify instance.
 * @param plan_id - The plan ID
 * @returns A promise that resolves to an object containing a message indicating the result.
 * @throws Will throw an error if the fetch request fails.
 */
export const getMaasApplicationPlanFeatures = async (
  fastify: KubeFastifyInstance,
  plan_id: number,
): Promise<{ message: string }> => {
  var url = new URL(MAAS_API_URL + '/admin/api/application_plans/' + plan_id + '/features.xml');
  var urlParams = new URLSearchParams();
  urlParams.append('access_token', MAAS_API_KEY);
  var response = await fetch(`${url}?${urlParams}`, {
    method: 'GET',
    headers: {
      Accept: '*/*',
    },
  });

  var data = await response.text(); // since it's XML
         
  return { message: data }
}

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
      console.debug("Applications: " + JSON.stringify(applications));
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
          const applicationPlanResponse = await getMaasApplicationPlan(fastify, service_name);
          const planId = applicationPlanResponse.message;

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
  fastify.log.info(`Retrieving of Application for ${service_name}`);

  const applicationPlanResponse = await getMaasApplicationPlan(fastify, service_name);
  const planId = parseInt(applicationPlanResponse.message);
  
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

/**
 * Get the Vector DB configuration
 *
 * @param fastify - The Fastify instance.
 * @returns A promise that resolves to an object containing a message indicating the result.
 * @throws Will throw an error if the fetch request fails.
 */
export const getVectorDBConfiguration = async (
  fastify: KubeFastifyInstance,
): Promise<{ message: string }> => {
  // Check if user exists

  fastify.log.info(`Retrieving of Vector DB config`);

  var vectorDB;

  if (VECTOR_DB == "lancedb") {
    vectorDB = {
      VECTOR_DB: VECTOR_DB
    }
  } else if (VECTOR_DB == "weaviate") {
    vectorDB = {
      VECTOR_DB: VECTOR_DB,
      WEAVIATE_ENDPOINT: WEAVIATE_ENDPOINT
    }
  } else if (VECTOR_DB == "qdrant") {
    vectorDB = {
      VECTOR_DB: VECTOR_DB,
      QDRANT_ENDPOINT: QDRANT_ENDPOINT
    }
  }

  return {message: JSON.stringify(vectorDB)};
};

/**
 * Checks if guard is enabled
 *
 * @param fastify - The Fastify instance.
 * @returns A promise that resolves to an object containing a message indicating the result.
 * @throws Will throw an error if the fetch request fails.
 */
export const isGuardEnabled = async (
  fastify: KubeFastifyInstance,
): Promise<{ message: string }> => {
  let guardEnabled = "false";

  if (typeof GUARD_ENABLED !== "undefined")
    guardEnabled = GUARD_ENABLED;

  return {message: guardEnabled};
};

/**
 * Checks if safety is enabled
 *
 * @param fastify - The Fastify instance.
 * @returns A promise that resolves to an object containing a message indicating the result.
 * @throws Will throw an error if the fetch request fails.
 */
export const isSafetyEnabled = async (
  fastify: KubeFastifyInstance,
): Promise<{ message: string }> => {
  let safetyEnabled = "false";

  if (typeof SAFETY_ENABLED !== "undefined")
    safetyEnabled = SAFETY_ENABLED;

  return {message: safetyEnabled};
};