import {
  createIntegrationEntity,
  convertProperties,
  Entity,
  parseTimePropertyValue,
} from '@jupiterone/integration-sdk-core';
import { getCVSS3Severity } from './utils';

export const getAccountEntity = (instance: any): Entity => ({
  _key: `nowsecure:account:${instance.id}`,
  _type: 'nowsecure_account',
  _class: ['Account'],
  name: instance.name,
  displayName: instance.name,
  description: instance.description,
});

export const getServiceEntity = (instance: any): Entity => ({
  _key: `nowsecure:service:${instance.id}:mast`,
  _type: 'nowsecure_service',
  _class: ['Service'],
  name: 'NowSecure MAST',
  displayName: 'NowSecure MAST',
  description: 'Mobile Application Security Testing (MAST)',
  category: 'software',
  function: 'MAST',
});

export const convertUser = (data: any): Entity =>
  createIntegrationEntity({
    entityData: {
      source: data,
      assign: {
        ...convertProperties(data),
        _key: `nowsecure-user:${data.id}`,
        _type: 'nowsecure_user',
        _class: ['User'],
        id: `nowsecure-user:${data.id}`,
        displayName: data.name,
        username: data.email,
        createdOn: parseTimePropertyValue(data.created_at),
        updatedOn: parseTimePropertyValue(data.updated_at),
        roles: data.roles?.map((r) => r.label),
      },
    },
  });

export const convertApp = (data: any): Entity =>
  createIntegrationEntity({
    entityData: {
      source: data,
      assign: {
        ...convertProperties(data),
        _key: `app:mobile:${data.platform}:${data.package}`,
        _type: 'mobile_app',
        _class: ['Application'],
        name: data.title,
        displayName: data.title,
        createdOn: parseTimePropertyValue(data.created),
        webLink: `https://lab.nowsecure.com/app/${data.ref}`,
      },
    },
  });

export const convertAssessment = (data: any): Entity =>
  createIntegrationEntity({
    entityData: {
      source: data,
      assign: {
        ...convertProperties(data),
        _key: `app:mobile:assessment:${data.platform}:${data.package}`,
        _type: 'nowsecure_assessment',
        _class: ['Assessment'],
        name: data.title,
        displayName: data.title,
        createdOn: parseTimePropertyValue(data.created),
        webLink: `https://lab.nowsecure.com/app/${data.ref}`,
      },
    },
  });

export const convertFinding = (data: any, app: string): Entity =>
  createIntegrationEntity({
    entityData: {
      source: data,
      assign: {
        _key: `nowsecure-finding:${app}:${data.unique_vulnerability_id}:${data.finding_id}`,
        _type: 'nowsecure_finding',
        _class: ['Finding'],
        vulnId: data.unique_vulnerability_id,
        name: data.finding_id,
        displayName: data.finding_id,
        category: 'mobile',
        createdOn: parseTimePropertyValue(data.opened_at),
        lastSeenOn: parseTimePropertyValue(data.last_seen_at),
        openedOn: parseTimePropertyValue(data.opened_at),
        closedOn: parseTimePropertyValue(data.closed_on),
        score: data.last_seen_cvss,
        numericSeverity: data.last_seen_cvss,
        severity: getCVSS3Severity(data.last_seen_cvss),
        openedInAppVersion: data.opened_in_app_version,
        lastSeenInAppVersion: data.last_seen_in_app_version,
        closedInAppVersion: data.closed_in_app_version,
        webLink: `https://lab.nowsecure.com/app/${app}/assessment#finding-${data.finding_id}`,
        open: true,
      },
    },
  });
