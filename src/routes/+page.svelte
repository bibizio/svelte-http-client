<script lang="ts">
	import { SvelteHttpClient } from '$lib';

	interface Post {
		title: string;
		body: string;
	}
	const client = new SvelteHttpClient();
	let posts$ = client
		.get$('https://jsonplaceholder.typicode.com/posts')
		.then$((res) => res.json() as Promise<Post[]>)
		.catch$((err) => {
			console.log(err);
			return [] as Post[];
		})
		.startWith$([] as Post[]);

	let bla = 'bla';
	function postApost() {
		console.log('postApost');
		client.post$(
			'https://jsonplaceholder.typicode.com/posts',
			{
				title: 'foo',
				body: 'bar',
				userId: 1
			},
			{
				headers: {
					'Content-type': 'application/json; charset=UTF-8'
				}
			}
		);
		// .then$((res) => res.json())
		// .then$((res: { title: string; body: string }) => {
		//     bla = res.title
		// })
		// .finally$(() => console.log('ciao'));
	}
	function putApost() {
		console.log('putApost');
		client
			.put$('https://jsonplaceholder.typicode.com/posts/1', {
				id: 1,
				title: 'foo',
				body: 'bar',
				userId: 1
			})
			.then$((res) => res.json())
			.catch$(console.log)
			.finally$(console.log);
	}
	function patchApost() {
		console.log('patchApost');
		client
			.patch$('https://jsonplaceholder.typicode.com/posts/1', {
				title: 'foo'
			})
			.then$((res) => res.json())
			.catch$(console.log)
			.finally$(console.log);
	}
	function deleteApost() {
		console.log('deleteApost');
		client
			.delete$('https://jsonplaceholder.typicode.com/posts/1')
			.then$((res) => res.json())
			.catch$(console.log)
			.finally$(console.log);
	}
</script>

<button on:click={postApost}>post</button>
<button on:click={putApost}>put</button>
<button on:click={patchApost}>patch</button>
<button on:click={deleteApost}>delete</button>
{bla}
<ul>
	{#each $posts$ as { title, body }}
		<li>
			<h2>{title}</h2>
			<p>{body}</p>
		</li>
	{/each}
</ul>
