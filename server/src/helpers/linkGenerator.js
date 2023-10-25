export const generateLinks = (baseUrl, url, page, totalQueryResults) => {
	const totalPages = Math.ceil(totalQueryResults / process.env.ITEMS_PER_PAGE);

	const apiSegment = `/api/${process.env.API_VERSION}`;
	baseUrl = baseUrl.replace(apiSegment, '');

	let updatedUrl = url.replace(/page=\d+/g, '');

	if (updatedUrl.startsWith('/?&')) {
		updatedUrl = updatedUrl.replace('/?&', '/?');
	}

	const generateLink = (pageNumber) => {
		const separator = updatedUrl.includes('?') ? '&' : '?';
		return `${process.env.PROTOCOL}://${process.env.BASE_URL}${baseUrl}${updatedUrl}${separator}page=${pageNumber}`;
	};

	return {
		first: totalPages > 1 ? generateLink(1) : null,
		last: totalPages > 1 ? generateLink(totalPages) : null,
		prev3: page * 1 - 3 > 0 ? generateLink(page * 1 - 3) : null,
		prev2: page * 1 - 2 > 0 ? generateLink(page * 1 - 2) : null,
		prev1: page * 1 - 1 > 0 ? generateLink(page * 1 - 1) : null,
		next1: page * 1 + 1 <= totalPages ? generateLink(page * 1 + 1) : null,
		next2: page * 1 + 2 <= totalPages ? generateLink(page * 1 + 2) : null,
		next3: page * 1 + 3 <= totalPages ? generateLink(page * 1 + 3) : null
	};
};
