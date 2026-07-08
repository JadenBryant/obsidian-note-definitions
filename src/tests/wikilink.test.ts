import { renderWikilinks } from "src/editor/wikilink";

describe("renderWikilinks", () => {
	test("renders aliased wikilinks with the alias as visible text", () => {
		expect(
			renderWikilinks(
				"property of [[Function (discrete math)|functions]]",
			),
		).toBe(
			'property of <a class="internal-link" data-href="Function (discrete math)" href="Function (discrete math)">functions</a>',
		);
	});

	test("renders plain wikilinks with the target as visible text", () => {
		expect(renderWikilinks("[[Surjective function]]")).toBe(
			'<a class="internal-link" data-href="Surjective function" href="Surjective function">Surjective function</a>',
		);
	});

	test("does not render embedded wikilinks", () => {
		expect(renderWikilinks("![[diagram.png]]")).toBe("![[diagram.png]]");
	});
});
