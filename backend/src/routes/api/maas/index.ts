import { FastifyReply, FastifyRequest } from 'fastify';
import { KubeFastifyInstance } from '../../../types';
import { secureRoute } from '../../../utils/route-security';
import {
  checkOrCreateMaasApplication,
  checkOrCreateMaasUser,
  deleteMaasApplication,
  getMaasApplicationPlanEndpoint,
  getVectorDBConfiguration,
  helloMaas,
  isGuardEnabled,
  isSafetyEnabled,
} from './maas-utils';

interface CheckMaasUserParams {
  username: string;
}

interface CheckMaasApplicationBody {
  user_name: string;
  app_name: string;
  service_name: string;
}

interface DeleteMaasApplicationBody {
  user_name: string;
  app_name: string;
}

interface CheckMaasGatewayConfigParams {
  service_name: string;
}

export default async (fastify: KubeFastifyInstance): Promise<void> => {
  // Health check
  fastify.get(
    '/',
    secureRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) =>
      helloMaas(fastify)
        .then((res) => res)
        .catch((res) => {
          reply.send(res);
        }),
    ),
  );

  // Check if the user exists in the MaaS database, if not, create it
  fastify.get(
    '/check-create-user/:username',
    secureRoute(fastify)(
      async (request: FastifyRequest<{ Params: CheckMaasUserParams }>, reply: FastifyReply) =>
        checkOrCreateMaasUser(fastify, request.params.username)
          .then((res) => reply.send(res))
          .catch((res) => {
            reply.send(res);
          }),
    ),
  );

  // Check if the application exists for a user, if not, create it, including user creation
  fastify.post(
    '/check-create-application',
    {
      schema: {
        body: {
          type: 'object',
          required: ['user_name', 'app_name', 'service_name'],
          properties: {
            user_name: { type: 'string' },
            app_name: { type: 'string' },
            service_name: { type: 'string' },
          },
        },
      },
    },
    secureRoute(fastify)(
      async (request: FastifyRequest<{ Body: CheckMaasApplicationBody }>, reply: FastifyReply) =>
        checkOrCreateMaasApplication(
          fastify,
          request.body.user_name,
          request.body.app_name,
          request.body.service_name,
        )
          .then((res) => reply.send(res))
          .catch((res) => {
            reply.send(res);
          }),
    ),
  );

  // Route to delete an application
  fastify.delete(
    '/delete-application',
    {
      schema: {
        body: {
          type: 'object',
          required: ['user_name', 'app_name'],
          properties: {
            user_name: { type: 'string' },
            app_name: { type: 'string' },
          },
        },
      },
    },
    secureRoute(fastify)(
      async (request: FastifyRequest<{ Body: DeleteMaasApplicationBody }>, reply: FastifyReply) =>
        deleteMaasApplication(fastify, request.body.user_name, request.body.app_name)
          .then((res) => reply.send(res))
          .catch((res) => {
            reply.send(res);
          }),
    ),
  );

  // Route to get proxy configuration
  fastify.get(
    '/get-application-plan-endpoint/:service_name',
    secureRoute(fastify)(
      async (request: FastifyRequest<{ Params: CheckMaasGatewayConfigParams }>, reply: FastifyReply) =>
        getMaasApplicationPlanEndpoint(fastify, request.params.service_name)
          .then((res) => reply.send(res))
          .catch((res) => {
            reply.send(res);
          }),
    ),
  );

  // Route to get Vector DB configuration
  fastify.get(
    '/get-vectordb-configuration',
    secureRoute(fastify)(
      async (request: FastifyRequest<{ Params: CheckMaasGatewayConfigParams }>, reply: FastifyReply) =>
        getVectorDBConfiguration(fastify)
          .then((res) => reply.send(res))
          .catch((res) => {
            reply.send(res);
          }),
    ),
  );

  // Route to is guard enabled
  fastify.get(
    '/is-guard-enabled',
    secureRoute(fastify)(
      async (request: FastifyRequest<{ Params: CheckMaasGatewayConfigParams }>, reply: FastifyReply) =>
        isGuardEnabled(fastify)
          .then((res) => reply.send(res))
          .catch((res) => {
            reply.send(res);
          }),
    ),
  );

  // Route to is safety enabled
  fastify.get(
    '/is-safety-enabled',
    secureRoute(fastify)(
      async (request: FastifyRequest<{ Params: CheckMaasGatewayConfigParams }>, reply: FastifyReply) =>
        isSafetyEnabled(fastify)
          .then((res) => reply.send(res))
          .catch((res) => {
            reply.send(res);
          }),
    ),
  );
  
};
