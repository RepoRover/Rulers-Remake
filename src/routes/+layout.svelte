<script>
	export let data;
	import { HeaderMenu } from '$components';
	import { page } from '$app/stores';

	const noLayoutUrls = ['/login', '/signup'];
</script>

{#if noLayoutUrls.includes($page.url.pathname)}
	<slot />
{:else}
	<HeaderMenu />
	<slot />
{/if}
