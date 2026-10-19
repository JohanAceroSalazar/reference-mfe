import { HttpClient, HttpError } from '@sena/frontend-platform';

export class ReferenceDataHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ReferenceDataHttpError';
  }
}

export class MissingReferenceDataConfigurationError extends Error {
  constructor() {
    super('Falta configurar VITE_REFERENCE_DATA_API_BASE_URL.');
    this.name = 'MissingReferenceDataConfigurationError';
  }
}

const baseUrlWithSlash = (baseUrl: string): string =>
  baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

const clients = new Map<string, HttpClient>();

const clientFor = (baseUrl: string): HttpClient => {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/$/, '');
  if (!normalizedBaseUrl) throw new MissingReferenceDataConfigurationError();
  const cached = clients.get(normalizedBaseUrl);
  if (cached) return cached;

  // The shell and other authenticated frontends keep the session token here.
  // HttpClient is the shared component responsible for its Bearer header.
  const client = new HttpClient({
    baseUrl: normalizedBaseUrl,
    tokenProvider: {
      getAccessToken: () => sessionStorage.getItem('sena.access_token'),
      clear: () => sessionStorage.removeItem('sena.access_token'),
    },
  });
  clients.set(normalizedBaseUrl, client);
  return client;
};

export const buildReferenceDataUrl = (baseUrl: string, path: string): URL => {
  const normalizedBaseUrl = baseUrl.trim();
  if (!normalizedBaseUrl) throw new MissingReferenceDataConfigurationError();
  return new URL(path.replace(/^\//, ''), baseUrlWithSlash(normalizedBaseUrl));
};

export async function requestReferenceData<T>(
  baseUrl: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  try {
    return await clientFor(baseUrl).request<T>(`/${path.replace(/^\//, '')}`, init);
  } catch (error) {
    if (error instanceof HttpError) {
      throw new ReferenceDataHttpError(error.message, error.status, error.code);
    }
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new Error(
      'No fue posible conectar con Reference Data. Verifica la conexión e intenta nuevamente.',
      { cause: error },
    );
  }
}

export const jsonBody = (body: unknown): string => JSON.stringify(body);
