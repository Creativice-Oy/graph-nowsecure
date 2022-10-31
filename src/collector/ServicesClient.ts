import { retry } from '@lifeomic/attempt';
import nodeFetch, { Request } from 'node-fetch';

import { retryableRequestError, fatalRequestError } from './error';
import { URLSearchParams } from 'url';
import { IntegrationConfig } from '../types';

interface QueryParam {
  [param: string]: string | string[];
}

const BASE_URL = 'https://lab-api.nowsecure.com/';

/**
 * Services Api
 * https://developer.nowsecure.com/
 */
export class ServicesClient {
  readonly baseUrl: string;
  readonly authHeader: { [key: string]: string };

  constructor(config: IntegrationConfig) {
    this.baseUrl = BASE_URL;
    this.authHeader = {
      Authorization: `Bearer ${config.apiToken}`,
    };
  }

  test(): Promise<any[]> {
    return this.fetch('account/user/');
  }

  listUsers(): Promise<any[]> {
    return this.fetch('account/user/');
  }

  listApplications(): Promise<any[]> {
    return this.fetch(`app/`);
  }

  listAppFindings(ref: string): Promise<any[]> {
    return this.fetch(`resource/app/${ref}/vulnerability/`);
  }

  listAssessments(platform: string, pkg: string): Promise<any[]> {
    return this.fetch(`app/${platform}/${pkg}/assessment/`);
  }

  fetch<T = object>(
    url: string,
    queryParams: QueryParam = {},
    request?: Omit<Request, 'url'>,
  ): Promise<T> {
    return retry(
      async () => {
        const qs = new URLSearchParams(queryParams).toString();
        const response = await nodeFetch(
          `${BASE_URL}${url}${qs ? '?' + qs : ''}`,
          {
            ...request,
            headers: {
              ...this.authHeader,
              ...request?.headers,
            },
          },
        );

        /**
         * We are working with a json api, so just return the parsed data.
         */
        if (response.ok) {
          return (await response.json()) as T;
        }

        if (isRetryableRequest(response)) {
          throw retryableRequestError(response);
        } else {
          throw fatalRequestError(response);
        }
      },
      {
        maxAttempts: 10,
        delay: 200,
        factor: 2,
        jitter: true,
        handleError: (err, context) => {
          if (!err.retryable) {
            // can't retry this? just abort
            context.abort();
          }
        },
      },
    );
  }
}

/**
 * Function for determining if a request is retryable
 * based on the returned status.
 */
function isRetryableRequest({ status }: Response): boolean {
  return (
    // 5xx error from provider (their fault, might be retryable)
    // 429 === too many requests, we got rate limited so safe to try again
    status >= 500 || status === 429
  );
}
