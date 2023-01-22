import { noop } from 'svelte/internal';
import { readable, type Readable, type Subscriber, type Unsubscriber } from 'svelte/store';

export class HttpError extends Error {
	name: string;
	status: number;
	body: string;
	constructor(status: number, statusText: string, body: string) {
		super(statusText);
		this.name = this.constructor.name;
		this.status = status;
		this.body = body;
	}
}

async function _fetch(url: URL, config: RequestInit): Promise<Response> {
	const response = await fetch(url, config);

	if (!response.ok) {
		const { status, statusText, headers } = response;
		const body = headers.get('content-type')?.includes('application/json')
			? await response.json()
			: await response.text();
		throw new HttpError(status, statusText, body);
	}

	return response;
}

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

export class SvelteHttpClient {
	private _baseUrl: URL | string | undefined;

	constructor(baseUrl?: URL | string) {
		this._baseUrl = baseUrl;
	}

	fetch$(endpoint: string | URL, init: RequestInit = {}) {
		const promise = fetch(new URL(endpoint, this._baseUrl), init);
		return promisable(undefined, promise);
	}

	get$(endpoint: string | URL, init: RequestInit = {}): Promisable<undefined, Response> {
		const _init: RequestInit = {
			...init,
			method: 'GET'
		};
		const promise = _fetch(new URL(endpoint, this._baseUrl), _init);
		return promisable(undefined, promise);
	}
	post$(
		endpoint: string | URL,
		body: any = null,
		init: RequestInit = {}
	): Promisable<undefined, Response> {
		const _init: RequestInit = {
			...init,
			method: 'POST',
			body: JSON.stringify(body)
		};
		const promise = _fetch(new URL(endpoint, this._baseUrl), _init);
		return promisable(undefined, promise);
	}
	put$(
		endpoint: string | URL,
		body: any = null,
		init: RequestInit = {}
	): Promisable<undefined, Response> {
		const _init: RequestInit = {
			...init,
			method: 'PUT',
			body: JSON.stringify(body)
		};
		const promise = _fetch(new URL(endpoint, this._baseUrl), _init);
		return promisable(undefined, promise);
	}
	patch$(
		endpoint: string | URL,
		body: any = null,
		init: RequestInit = {}
	): Promisable<undefined, Response> {
		const _init: RequestInit = {
			...init,
			method: 'PATCH',
			body: JSON.stringify(body)
		};
		const promise = _fetch(new URL(endpoint, this._baseUrl), _init);
		return promisable(undefined, promise);
	}
	delete$(endpoint: string | URL, init: RequestInit = {}): Promisable<undefined, Response> {
		const _init: RequestInit = {
			...init,
			method: 'DELETE'
		};
		const promise = _fetch(new URL(endpoint, this._baseUrl), _init);
		return promisable(undefined, promise);
	}
}
