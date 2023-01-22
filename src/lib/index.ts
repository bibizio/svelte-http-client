import { noop } from 'svelte/internal';
import { readable, type Readable, type Subscriber, type Unsubscriber } from 'svelte/store';

interface Promisable<T, U> extends Readable<T | U> {
	then$<V>(onfulfilled?: ((value: U) => V | PromiseLike<V>) | undefined | null): Promisable<T, V>;
	catch$<V>(
		onrejected?: ((reason: any) => V | PromiseLike<V>) | undefined | null
	): Promisable<T, U | V>;
	finally$(onfinally?: (() => void) | undefined | null): Promisable<T, U>;
	startWith$<V>(initialValue: V): Promisable<V, U>;
}
function promisable<T, U>(initialValue: T, promise: Promise<U>): Promisable<T, U> {
	const _initialValue = initialValue;
	const _promise = promise;

	function then$<V>(
		onfulfilled?: ((value: U) => V | PromiseLike<V>) | undefined | null
	): Promisable<T, V> {
		return promisable(_initialValue, _promise.then(onfulfilled));
	}
	function catch$<V>(
		onrejected?: ((reason: any) => V | PromiseLike<V>) | undefined | null
	): Promisable<T, U | V> {
		return promisable(_initialValue, _promise.catch(onrejected));
	}
	function finally$(onfinally?: (() => void) | undefined | null): Promisable<T, U> {
		return promisable(_initialValue, _promise.finally(onfinally));
	}
	function startWith$<V>(initialValue: V): Promisable<V, U> {
		return promisable(initialValue, _promise);
	}
	function subscribe(
		run: Subscriber<T | U>,
		invalidate: (value?: T | U) => void = noop
	): Unsubscriber {
		return readable<T | U>(_initialValue, (set) => {
			_promise.then((value: U) => {
				set(value);
			});
		}).subscribe(run, invalidate);
	}

	return { then$, catch$, finally$, startWith$, subscribe };
}
export class HttpError extends Error {
	name: string;
	status: number;
	statusText: string;
	body: string;
	constructor(status: number, statusText: string, body: string) {
		super(statusText);
		this.name = this.constructor.name;
		this.status = status;
		this.statusText = statusText;
		this.body = body;
	}
}

export function fetch$(
	input: URL | RequestInfo,
	init?: RequestInit
): Promisable<undefined, Response> {
	return promisable(undefined, fetch(input, init));
}
function fetchErrorHandled$(
	input: URL | RequestInfo,
	init?: RequestInit
): Promisable<undefined, Response> {
	return fetch$(input, init).then$(async (response) => {
		if (response.ok) return response;

		const { status, statusText, headers } = response;
		const body = headers.get('content-type')?.includes('application/json')
			? await response.json()
			: await response.text();
		throw new HttpError(status, statusText, body);
	});
}
function fetchJson$<T>(input: URL | RequestInfo, init?: RequestInit): Promisable<undefined, T> {
	return fetchErrorHandled$(input, init).then$((response) => response.json() as T);
}

export function get$(
	endpoint: string | URL,
	init: RequestInit = {}
): Promisable<undefined, Response> {
	return fetchErrorHandled$(endpoint, { ...init, method: 'GET' });
}
export function getJson$<T>(
	endpoint: string | URL,
	init: RequestInit = {}
): Promisable<undefined, T> {
	return fetchJson$<T>(endpoint, { ...init, method: 'GET' });
}

export function post$(
	endpoint: string | URL,
	body: any = null,
	init: RequestInit = {}
): Promisable<undefined, Response> {
	return fetchErrorHandled$(endpoint, {
		...init,
		method: 'POST',
		body: JSON.stringify(body)
	});
}
export function postJson$<T>(
	endpoint: string | URL,
	body: any = null,
	init: RequestInit = {}
): Promisable<undefined, T> {
	return fetchJson$<T>(endpoint, {
		...init,
		method: 'POST',
		body: JSON.stringify(body)
	});
}

export function put$(
	endpoint: string | URL,
	body: any = null,
	init: RequestInit = {}
): Promisable<undefined, Response> {
	return fetchErrorHandled$(endpoint, {
		...init,
		method: 'PUT',
		body: JSON.stringify(body)
	});
}
export function putJson$<T>(
	endpoint: string | URL,
	body: any = null,
	init: RequestInit = {}
): Promisable<undefined, T> {
	return fetchJson$<T>(endpoint, {
		...init,
		method: 'PUT',
		body: JSON.stringify(body)
	});
}

export function patch$(
	endpoint: string | URL,
	body: any = null,
	init: RequestInit = {}
): Promisable<undefined, Response> {
	return fetchErrorHandled$(endpoint, {
		...init,
		method: 'PATCH',
		body: JSON.stringify(body)
	});
}
export function patchJson$<T>(
	endpoint: string | URL,
	body: any = null,
	init: RequestInit = {}
): Promisable<undefined, T> {
	return fetchJson$<T>(endpoint, {
		...init,
		method: 'PATCH',
		body: JSON.stringify(body)
	});
}

export function delete$(
	endpoint: string | URL,
	init: RequestInit = {}
): Promisable<undefined, Response> {
	return fetchErrorHandled$(endpoint, { ...init, method: 'DELETE' });
}
export function deleteJson$<T>(
	endpoint: string | URL,
	init: RequestInit = {}
): Promisable<undefined, T> {
	return fetchJson$<T>(endpoint, { ...init, method: 'DELETE' });
}

export class SvelteHttpClient {
	private _baseUrl: URL | string | undefined;
	private _init: RequestInit;

	constructor(baseUrl?: URL | string, init: RequestInit = {}) {
		this._baseUrl = baseUrl;
		this._init = init;
	}

	fetch$(input: URL | RequestInfo, init: RequestInit = {}) {
		const _input =
			input instanceof Request
				? new Request(this._baseUrl + input.url, input)
				: new URL(input, this._baseUrl);
		return fetch$(_input, { ...this._init, ...init });
	}
	get$(endpoint: string | URL, init: RequestInit = {}): Promisable<undefined, Response> {
		return get$(new URL(endpoint, this._baseUrl), { ...this._init, ...init });
	}
	getJson$<T>(endpoint: string | URL, init: RequestInit = {}): Promisable<undefined, T> {
		return getJson$<T>(new URL(endpoint, this._baseUrl), { ...this._init, ...init });
	}
	post$(
		endpoint: string | URL,
		body: any = null,
		init: RequestInit = {}
	): Promisable<undefined, Response> {
		return post$(new URL(endpoint, this._baseUrl), body, { ...this._init, ...init });
	}
	postJson$<T>(
		endpoint: string | URL,
		body: any = null,
		init: RequestInit = {}
	): Promisable<undefined, T> {
		return postJson$<T>(new URL(endpoint, this._baseUrl), body, { ...this._init, ...init });
	}
	put$(
		endpoint: string | URL,
		body: any = null,
		init: RequestInit = {}
	): Promisable<undefined, Response> {
		return put$(new URL(endpoint, this._baseUrl), body, { ...this._init, ...init });
	}
	putJson$<T>(
		endpoint: string | URL,
		body: any = null,
		init: RequestInit = {}
	): Promisable<undefined, T> {
		return putJson$<T>(new URL(endpoint, this._baseUrl), body, { ...this._init, ...init });
	}
	patch$(
		endpoint: string | URL,
		body: any = null,
		init: RequestInit = {}
	): Promisable<undefined, Response> {
		return patch$(new URL(endpoint, this._baseUrl), body, { ...this._init, ...init });
	}
	patchJson$<T>(
		endpoint: string | URL,
		body: any = null,
		init: RequestInit = {}
	): Promisable<undefined, T> {
		return patchJson$<T>(new URL(endpoint, this._baseUrl), body, { ...this._init, ...init });
	}
	delete$(endpoint: string | URL, init: RequestInit = {}): Promisable<undefined, Response> {
		return delete$(new URL(endpoint, this._baseUrl), { ...this._init, ...init });
	}
	deleteJson$<T>(endpoint: string | URL, init: RequestInit = {}): Promisable<undefined, T> {
		return deleteJson$<T>(new URL(endpoint, this._baseUrl), { ...this._init, ...init });
	}
}
