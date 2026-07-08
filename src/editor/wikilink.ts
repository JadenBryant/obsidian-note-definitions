export function renderWikilinks(markdown: string): string {
	return markdown.replace(
		/(^|[^!])\[\[([^\]\n]+)\]\]/g,
		(match, prefix: string, linkContent: string) => {
			const { linkText, displayText } = parseWikilink(linkContent);
			return `${prefix}<a class="internal-link" data-href="${escapeAttr(
				linkText,
			)}" href="${escapeAttr(linkText)}">${escapeHtml(displayText)}</a>`;
		},
	);
}

export function restoreRenderedWikilinkText(container: HTMLElement) {
	const hiddenOriginalLinks = container.querySelectorAll<HTMLElement>(
		"a.original-internal-link",
	);

	hiddenOriginalLinks.forEach((hiddenLink) => {
		const visibleLink = hiddenLink.nextElementSibling;
		if (
			!(visibleLink instanceof HTMLElement) ||
			!visibleLink.hasClass("internal-link") ||
			visibleLink.textContent
		) {
			return;
		}

		const hiddenHref =
			hiddenLink.getAttr("data-href") ?? hiddenLink.getAttr("href");
		const visibleHref =
			visibleLink.getAttr("data-href") ?? visibleLink.getAttr("href");
		if (hiddenHref && visibleHref && hiddenHref !== visibleHref) {
			return;
		}

		visibleLink.setText(hiddenLink.textContent ?? "");
	});
}

function parseWikilink(linkContent: string) {
	const pipeIdx = linkContent.indexOf("|");
	const linkText =
		pipeIdx === -1
			? linkContent.trim()
			: linkContent.slice(0, pipeIdx).trim();
	const displayText =
		pipeIdx === -1
			? getDefaultDisplayText(linkText)
			: linkContent.slice(pipeIdx + 1).trim();

	return {
		linkText,
		displayText: displayText || getDefaultDisplayText(linkText),
	};
}

function getDefaultDisplayText(linkText: string) {
	const withoutBlock = linkText.split("^")[0];
	const headingIdx = withoutBlock.lastIndexOf("#");
	return headingIdx === -1
		? withoutBlock.trim()
		: withoutBlock.slice(headingIdx + 1).trim();
}

function escapeHtml(value: string) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

function escapeAttr(value: string) {
	return escapeHtml(value).replace(/"/g, "&quot;");
}
