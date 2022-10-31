import {
  IntegrationStep,
  IntegrationStepExecutionContext,
  createDirectRelationship,
  RelationshipClass,
  Entity,
  getRawData,
} from '@jupiterone/integration-sdk-core';
import { createServicesClient } from '../../collector';

import { convertAssessment } from '../../converter';
import { IntegrationConfig } from '../../types';

const step: IntegrationStep<IntegrationConfig> = {
  id: 'fetch-assessments',
  name: 'Fetch Assessments',
  entities: [
    {
      _class: 'Assessment',
      _type: 'nowsecure_assessment',
      resourceName: 'Assessment',
    },
  ],
  relationships: [
    {
      _type: 'nowsecure_service_performed_assessment',
      _class: RelationshipClass.PERFORMED,
      sourceType: 'nowsecure_service',
      targetType: 'nowsecure_assessment',
    },
    {
      _type: 'nowsecure_application_has_assessment',
      _class: RelationshipClass.HAS,
      sourceType: 'nowsecure_application',
      targetType: 'nowsecure_assessment',
    },
  ],
  async executionHandler({
    instance,
    logger,
    jobState,
  }: IntegrationStepExecutionContext<IntegrationConfig>) {
    const client = createServicesClient(instance);

    const serviceEntity = (await jobState.findEntity(
      `nowsecure:service:${instance.id}:mast`,
    )) as Entity;

    await jobState.iterateEntities(
      { _type: `mobile_app` },
      async (appEntity) => {
        const application = getRawData<any>(appEntity);

        if (!application) {
          logger.warn(`Can not get raw data for entity ${appEntity._key}`);
          return;
        }

        const assessments = await client.listAssessments(
          application.platform,
          application.package,
        );

        for (const assessment of assessments) {
          const assessmentEntity = await jobState.addEntity(
            convertAssessment(assessment),
          );

          await jobState.addRelationship(
            createDirectRelationship({
              from: serviceEntity,
              to: assessmentEntity,
              _class: RelationshipClass.PERFORMED,
            }),
          );

          await jobState.addRelationship(
            createDirectRelationship({
              from: appEntity,
              to: assessmentEntity,
              _class: RelationshipClass.HAS,
            }),
          );
        }
      },
    );
  },
};

export default step;
