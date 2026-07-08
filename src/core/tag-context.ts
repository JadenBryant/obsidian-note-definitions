export interface TagDefinitionContext {
	tag: string;
	path: string;
}

export function normaliseTag(tag: string): string {
	const trimmed = tag.trim();
	if (!trimmed) {
		return "";
	}
	return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}
