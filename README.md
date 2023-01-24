# svelte-http-client

HTTP client returning svelte stores

## Install

You can install via _npm_

`npm i svelte-http-client`

## Usage

### fetch$

The main method exported is `fetch$`, a wrapper for the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) that returns a `Promisable`, a custom svelte store that mimics the _Promise_ pattern.
On subscription, it unwraps the _Promise_ so it can be used like this:

```svelte
<script>
    import { fetch$ } from 'svelte-http-client';

    let value$ = fetch$('https://www.my.api/myendpoint')
        .then$((res) => {
            if(!res.ok) throw new Error();
            return res;
        })
        .then$((res) => res.json())
        .catch$((err) => {
            console.error(err);
            return 'default value';
        });
</script>

<p>{$value$}</p>
```

### HTTP verbs methods

The library exports also methods for the main HTTP verbs returning `Promisable` (ending with _$_) and _Promise_, each of them with a version that extract the json body:

- `get$`, `getJson$`, `get` and `getJson`
- `post$`, `postJson$`, `post` and `postJson`
- `put$`, `putJson$`, `put` and `putJson`
- `patch$`, `patchJson$` ,`patch` and `patchJson`
- `del$`, `delJson$`, `del` and `delJson`

These methods are also designed to throw an `HttpError` if the fetch Response is not ok.

The previous example, using the verbs methods, can be written as:

```svelte
<script>
    import { getJson$ } from 'svelte-http-client';

    let value$ = getJson$('https://www.my.api/myendpoint')
        .catch$((err) => {
            console.error(err);
            return 'default value';
        });
</script>

<p>{$value$}</p>
```

### SvelteHttpClient

The library exports a class to create an api client with default base URL and `fetch` init options, having all the methods described before:

```svelte
<script>
    import { SvelteHttpClient } from 'svelte-http-client';

    const client = new SvelteHttpClient('https://www.my.api/', {
        headers: { myheader: 'myHeaderValue' }
    });

    let value$ = client.getJson$('myendpoint')
        .catch$((err) => {
            console.error(err);
            return 'default value';
        });
    let anotherValue$ = client.getJson$('myotherendpoint')
        .catch$((err) => {
            console.error(err);
            return 'default value';
        });
</script>

<p>{$value$}</p>
<p>{$anotherValue$}</p>
```

### Promisable

The object returned by the library methods is a `Promisable`

```ts
interface Promisable<T, U> extends Readable<T | U> {
    then$<V>(onfulfilled?: ((value: U) => V | PromiseLike<V>) | undefined | null): Promisable<T, V>;
    catch$<V>(
        onrejected?: ((reason: any) => V | PromiseLike<V>) | undefined | null
    ): Promisable<T, U | V>;
    finally$(onfinally?: (() => void) | undefined | null): Promisable<T, U>;
    startWith$<V>(initialValue: V): Promisable<V, U>;
}
```

_T_ is the initial value of the `Readable`, while _U_ is the value returned by the _Promise_. The `fetch$` method returns a `Promisable<undefined, Response>`.
You can set the inital value chaining the `startWith$` method of `Promisable`.

(note: contrary to the original _then_, the `then$` method accepts `onfulfilled` only to enforce the use of `catch$`)

Here's an example using _typescript_:

```svelte
<script lang="ts">
    import { SvelteHttpClient } from 'svelte-http-client';

    const client = new SvelteHttpClient('https://www.my.api/');

    interface Post {
        title: string;
        body: string;
    }

    function refreshPosts() {
        return client
            .getJson$<Post[]>('posts')
            .catch$<Post[]>((err) => {
                console.error(err);
                return [];
            })
            .startWith$<Post[]>([]);
    }

    let loading = false;
    let post: Post = {
        title: '',
        body: '',
    };
    let posts$ = refreshPosts();

    function add() {
        loading = true;
        client
            .post$('posts', post)
            .then$(() => {
                posts$ = refreshPosts();
            })
            .catch$((err) => alert('error: ' + err.message))
            .finally$(() => (loading = false));
    }
</script>

{#if loading}
    <div class="overlay">loading</div>
{/if}
<label class="block" for="title"> Title</label>
<input class="block" id="title" bind:value={post.title} />
<label class="block" for="body"> Post</label>
<textarea class="block" id="body" bind:value={post.body} />
<button on:click={add}>post</button>

<ul>
    {#each $posts$ as { title, body }}
        <li>
            <h2>{title}</h2>
            <p>{body}</p>
        </li>
    {/each}
</ul>

<style>
    .overlay {
        position: absolute;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100vw;
        height: 100vh;
        top: 0;
        left: 0;
        background-color: rgba(255, 255, 255, 0.8);
    }

    .block {
        margin: 10px;
        display: block;
    }
</style>
```
