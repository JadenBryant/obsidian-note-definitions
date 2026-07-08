import {
	App,
	Component,
	MarkdownRenderer,
	normalizePath,
	Modal,
	TFile,
} from "obsidian";
import { Definition } from "src/core/model";
import { logError } from "src/util/log";
import { renderWikilinks, restoreRenderedWikilinkText } from "../wikilink";

let defModal: DefinitionModal;

export class DefinitionModal extends Component {
	app: App;
	modal: Modal;

	constructor(app: App) {
		super();
		this.app = app;
		this.modal = new Modal(app);
	}

	open(definition: Definition) {
		this.modal.contentEl.empty();
		this.modal.contentEl.createEl("h1", {
			text: definition.word,
		});
		this.modal.contentEl.createEl("i", {
			text: definition.aliases.join(", "),
		});
		const defContent = this.modal.contentEl.createEl("div", {
			attr: {
				ctx: "def-popup",
				"data-note-definitions-popup": "true",
			},
		});
		try {
			const renderResult = MarkdownRenderer.render(
				this.app,
				renderWikilinks(definition.definition),
				defContent,
				normalizePath(definition.file.path) ?? "",
				this,
			) as Promise<void> | void;
			this.postprocessMarkdown(defContent, definition.file);

			if (renderResult && typeof renderResult.then === "function") {
				void renderResult
					.then(() => {
						this.postprocessMarkdown(defContent, definition.file);
					})
					.catch((e) => {
						logError(`Rendering definition markdown failed: ${e}`);
					});
			}
		} catch (e) {
			logError(`Rendering definition markdown failed: ${e}`);
		}
		this.modal.open();
	}

	private postprocessMarkdown(el: HTMLDivElement, sourceFile: TFile) {
		restoreRenderedWikilinkText(el);

		const internalLinks = el.getElementsByClassName("internal-link");
		for (let i = 0; i < internalLinks.length; i++) {
			const linkEl = internalLinks.item(i);
			if (linkEl) {
				if (linkEl.getAttr("data-note-definitions-link-handled")) {
					continue;
				}
				linkEl.setAttr("data-note-definitions-link-handled", "true");
				linkEl.addEventListener("click", (e) => {
					e.preventDefault();
					const linkText =
						linkEl.getAttr("data-href") ?? linkEl.getAttr("href");
					this.modal.close();
					if (!linkText) {
						return;
					}
					this.app.workspace.openLinkText(
						linkText,
						normalizePath(sourceFile.path),
					);
				});
			}
		}
	}
}

export function initDefinitionModal(app: App) {
	defModal = new DefinitionModal(app);
	return defModal;
}

export function getDefinitionModal() {
	return defModal;
}
