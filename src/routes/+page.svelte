<script lang="ts">
	import { SvelteHttpClient } from '$lib';

	const client = new SvelteHttpClient('https://jsonplaceholder.typicode.com');

	interface Post {
		id?: number;
		title: string;
		body: string;
		userId: number;
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
		userId: 1
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
