import { App } from "obsidian";
import { DefManager } from "src/core/def-file-manager";
import { DefFileType } from "src/core/file-type";
import { Definition } from "src/core/model";
import { LineScanner } from "src/editor/definition-search";

describe("definition context", () => {
	let app: App;
	let activeFile: { path: string } | null;
	let fileCache: { frontmatter?: Record<string, unknown> } | null;
	let manager: DefManager;
	let loadDefinitionsSpy: jest.SpyInstance;
	let originalActiveWindow: unknown;
	let originalWindow: unknown;

	const definitionFile = {
		path: "definitions/terms.md",
	} as any;

	const definition: Definition = {
		key: "term",
		word: "term",
		aliases: [],
		definition: "A contextual definition.",
		file: definitionFile,
		linkText: "definitions/terms.md",
		fileType: DefFileType.Consolidated,
	};

	beforeEach(() => {
		originalActiveWindow = (global as any).activeWindow;
		originalWindow = (global as any).window;

		activeFile = { path: "note.md" };
		fileCache = { frontmatter: {} };
		app = {
			workspace: {
				getActiveFile: jest.fn(() => activeFile),
			},
			metadataCache: {
				getFileCache: jest.fn(() => fileCache),
			},
		} as unknown as App;

		(global as any).activeWindow = {
			NoteDefinition: {
				definitions: {},
				settings: {
					defFileParseConfig: {
						enableCaseSensitive: false,
					},
				},
			},
		};
		(global as any).window = (global as any).activeWindow;

		loadDefinitionsSpy = jest
			.spyOn(DefManager.prototype, "loadDefinitions")
			.mockImplementation();
		manager = new DefManager(app);
		manager.set(definition);
	});

	afterEach(() => {
		loadDefinitionsSpy.mockRestore();
		(global as any).activeWindow = originalActiveWindow;
		(global as any).window = originalWindow;
		jest.clearAllMocks();
	});

	test("active notes without def-context do not use global definitions", () => {
		manager.updateActiveFile();

		expect(manager.get("term")).toBeUndefined();
		expect(
			new LineScanner(manager.getPrefixTree()).scanLine("term"),
		).toEqual([]);
	});

	test("active notes with def-context use the requested definition files", () => {
		fileCache = {
			frontmatter: {
				"def-context": ["definitions/terms.md"],
			},
		};

		manager.updateActiveFile();

		expect(manager.get("term")).toBe(definition);
		expect(
			new LineScanner(manager.getPrefixTree()).scanLine("term"),
		).toEqual([
			{
				from: 0,
				to: 4,
				phrase: "term",
			},
		]);
	});
});
