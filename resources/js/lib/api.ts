export type ApiErrorPayload = {
    message?: string;
    errors?: Record<string, string[]>;
};

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly payload: ApiErrorPayload = {},
    ) {
        super(payload.message ?? `Request failed with status ${status}.`);
        this.name = 'ApiError';
    }
}

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
    json?: unknown;
};

const mutationMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

let csrfRequest: Promise<void> | null = null;

function readCookie(name: string): string | null {
    const prefix = `${name}=`;
    const cookie = document.cookie
        .split('; ')
        .find((entry) => entry.startsWith(prefix));

    return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

async function ensureCsrfCookie(): Promise<void> {
    if (readCookie('XSRF-TOKEN')) {
        return;
    }

    csrfRequest ??= fetch('/sanctum/csrf-cookie', {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
        credentials: 'same-origin',
    }).then((response) => {
        if (!response.ok) {
            throw new ApiError(response.status, {
                message: 'Unable to initialize a secure request.',
            });
        }
    });

    try {
        await csrfRequest;
    } finally {
        csrfRequest = null;
    }
}

export async function apiRequest<T>(
    url: string,
    options: ApiRequestOptions = {},
): Promise<T> {
    const { json, ...requestOptions } = options;
    const method = (requestOptions.method ?? 'GET').toUpperCase();

    if (mutationMethods.has(method)) {
        await ensureCsrfCookie();
    }

    const headers = new Headers(requestOptions.headers);

    headers.set('Accept', 'application/json');
    headers.set('X-Requested-With', 'XMLHttpRequest');

    if (json !== undefined) {
        headers.set('Content-Type', 'application/json');
    }

    if (mutationMethods.has(method)) {
        const csrfToken = readCookie('XSRF-TOKEN');

        if (!csrfToken) {
            throw new ApiError(419, {
                message: 'The security token is unavailable.',
            });
        }

        headers.set('X-XSRF-TOKEN', csrfToken);
    }

    const response = await fetch(url, {
        ...requestOptions,
        method,
        headers,
        credentials: 'same-origin',
        body: json === undefined ? undefined : JSON.stringify(json),
    });

    const isJsonResponse = response.headers
        .get('content-type')
        ?.includes('application/json');

    const payload = isJsonResponse ? await response.json() : null;

    if (!response.ok) {
        throw new ApiError(response.status, (payload ?? {}) as ApiErrorPayload);
    }

    return payload as T;
}
