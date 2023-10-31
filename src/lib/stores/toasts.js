import { writable } from 'svelte/store';
import { v4 } from 'uuid';

function createToastsStore() {
	const { subscribe, update } = writable([]);

	/**
	 * Adds a new toast to the list of toasts.
	 *
	 * @function
	 * @param {Object} options - The toast options.
	 * @param {string} options.type - The type of the toast.
	 * @param {string} options.message - The message of the toast.
	 * @param {string} options.id - The unique identifier for the toast.
	 * @param {number} [options.timeout=3000] - The time (in milliseconds) after which the toast should be removed. If set to 0 or a falsy value, the toast will not auto-remove.
	 */
	function addToast({ type, message, id, timeout = 3000 }) {
		// @ts-ignore
		update((toasts) => [{ type, message, id }, ...toasts]);
		if (timeout) {
			setTimeout(() => {
				removeToast(id);
			}, timeout);
		}
	}
	/**
	 *
	 * @param {string} id - The unique identifier for the toast.
	 */
	function removeToast(id) {
		// @ts-ignore
		update((toasts) => toasts.filter((t) => t.id !== id));
	}
	return {
		subscribe,
		/**
		 *
		 * @param {string} message
		 * @param {number} timeout
		 * @returns
		 */
		info: (message, timeout) =>
			addToast({
				type: 'info',
				message,
				timeout,
				id: v4()
			}),
		/**
		 *
		 * @param {string} message
		 * @param {number} timeout
		 * @returns
		 */
		warning: (message, timeout) =>
			addToast({
				type: 'warning',
				message,
				timeout,
				id: v4()
			}),
		/**
		 *
		 * @param {string} message
		 * @param {number} timeout
		 * @returns
		 */
		error: (message, timeout) =>
			addToast({
				type: 'error',
				message,
				timeout,
				id: v4()
			}),
		/**
		 *
		 * @param {string} message
		 * @param {number} timeout
		 * @returns
		 */
		success: (message, timeout) =>
			addToast({
				type: 'success',
				message,
				timeout,
				id: v4()
			}),
		/**
		 *
		 * @param {string} id
		 * @returns
		 */
		remove: (id) => removeToast(id)
	};
}

export default createToastsStore();
