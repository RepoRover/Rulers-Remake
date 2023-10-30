import { API_URL } from '$env/static/private';

/**@type {import('@sveltejs/kit').ServerLoad} */
export const load = async ({ fetch, cookies }) => {
	const accessToken = cookies.get('access_token');
	if (!accessToken) {
		return {
			user: null
		};
	}

	// const profileRes = await fetch(`${API_URL}/me`, {
	// 	headers: {
	// 		Authorization: `Bearer ${accessToken}`
	// 	}
	// });
	// // if (!profileRes.ok) {
	// // }
};
