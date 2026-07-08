import {
	App,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	setTooltip,
	TFile,
	TFolder,
} from "obsidian";
import { DefFileType } from "./core/file-type";
import { normaliseTag, TagDefinitionContext } from "./core/tag-context";

export enum PopoverEventSettings {
	Hover = "hover",
	Click = "click",
}

export enum PopoverDismissType {
	Click = "click",
	MouseExit = "mouse_exit",
}

export interface DividerSettings {
	dash: boolean;
	underscore: boolean;
}

export interface DefFileParseConfig {
	defaultFileType: DefFileType;
	divider: DividerSettings;
	autoPlurals: boolean;
	enableCaseSensitive: boolean;
}

export interface DefinitionPopoverConfig {
	displayAliases: boolean;
	displayDefFileName: boolean;
	enableCustomSize: boolean;
	maxWidth: number;
	maxHeight: number;
	popoverDismissEvent: PopoverDismissType;
	enableDefinitionLink: boolean;
	backgroundColour?: string;
}

export interface Settings {
	enableInReadingView: boolean;
	enableOnLinks: boolean;
	enableSpellcheck: boolean;
	defFolder: string;
	tagDefinitionContexts: TagDefinitionContext[];
	popoverEvent: PopoverEventSettings;
	defFileParseConfig: DefFileParseConfig;
	defPopoverConfig: DefinitionPopoverConfig;
}

export const VALID_DEFINITION_FILE_TYPES = [".md"];

export const DEFAULT_DEF_FOLDER = "definitions";

export const DEFAULT_SETTINGS: Partial<Settings> = {
	enableInReadingView: true,
	enableOnLinks: true,
	enableSpellcheck: true,
	tagDefinitionContexts: [],
	popoverEvent: PopoverEventSettings.Hover,
	defFileParseConfig: {
		defaultFileType: DefFileType.Consolidated,
		divider: {
			dash: true,
			underscore: false,
		},
		autoPlurals: false,
		enableCaseSensitive: false,
	},
	defPopoverConfig: {
		displayAliases: true,
		displayDefFileName: false,
		enableCustomSize: false,
		maxWidth: 150,
		maxHeight: 150,
		popoverDismissEvent: PopoverDismissType.Click,
		enableDefinitionLink: false,
	},
};

export class SettingsTab extends PluginSettingTab {
	plugin: Plugin;
	settings: Settings;
	saveCallback: () => Promise<void>;

	constructor(app: App, plugin: Plugin, saveCallback: () => Promise<void>) {
		super(app, plugin);
		this.plugin = plugin;
		this.settings = window.NoteDefinition.settings;
		this.saveCallback = saveCallback;
	}

	display(): void {
		let { containerEl } = this;

		this.settings.tagDefinitionContexts ??= [];
		containerEl.empty();

		new Setting(containerEl)
			.setName("Enable in Reading View")
			.setDesc(
				"Allow defined phrases and definition popovers to be shown in Reading View",
			)
			.addToggle((component) => {
				component.setValue(this.settings.enableInReadingView);
				component.onChange(async (val) => {
					this.settings.enableInReadingView = val;
					await this.saveCallback();
					this.display();
				});
			});

		if (this.settings.enableInReadingView) {
			new Setting(containerEl)
				.setName("Enable highlight on links")
				.setDesc(
					"Allow defined phrases and definition popovers to display on links (only applies to Reading View)",
				)
				.addToggle((component) => {
					component.setValue(this.settings.enableOnLinks);
					component.onChange(async (val) => {
						this.settings.enableOnLinks = val;
						await this.saveCallback();
					});
				});
		}

		new Setting(containerEl)
			.setName("Enable spellcheck for defined words")
			.setDesc("Allow defined words and phrases to be spellchecked")
			.addToggle((component) => {
				component.setValue(this.settings.enableSpellcheck);
				component.onChange(async (val) => {
					this.settings.enableSpellcheck = val;
					await this.saveCallback();
				});
			});

		new Setting(containerEl)
			.setName("Enable Case Sensitivity")
			.setDesc("Only match if the cases of both terms match")
			.addToggle((component) => {
				component.setValue(
					this.settings.defFileParseConfig.enableCaseSensitive,
				);
				component.onChange(async (val) => {
					this.settings.defFileParseConfig.enableCaseSensitive = val;
					await this.saveCallback();
				});
			});

		new Setting(containerEl)
			.setName("Definitions folder")
			.setDesc(
				"Files within this folder will be parsed to register definitions",
			)
			.addText((component) => {
				component.setValue(this.settings.defFolder);
				component.setPlaceholder(DEFAULT_DEF_FOLDER);
				component.setDisabled(true);
				setTooltip(
					component.inputEl,
					"In the file explorer, right-click on the desired folder and click on 'Set definition folder' to change the definition folder",
					{
						delay: 100,
					},
				);
			});

		new Setting(containerEl)
			.setName("Tag definition contexts")
			.setDesc(
				"Map note tags to definition files or folders. Notes with a mapped tag will use that definition context.",
			)
			.addButton((component) => {
				component
					.setButtonText("Manage")
					.onClick(() => this.openTagContextModal());
			});

		new Setting(containerEl)
			.setName("Definition file format settings")
			.setDesc("Customise parsing rules for definition files")
			.addExtraButton((component) => {
				component.onClick(() => {
					const modal = new Modal(this.app);
					modal.setTitle("Definition file format settings");
					new Setting(modal.contentEl)
						.setName("Divider")
						.setHeading();
					new Setting(modal.contentEl)
						.setName("Dash")
						.setDesc("Use triple dash (---) as divider")
						.addToggle((component) => {
							component.setValue(
								this.settings.defFileParseConfig.divider.dash,
							);
							component.onChange(async (value) => {
								if (
									!value &&
									!this.settings.defFileParseConfig.divider
										.underscore
								) {
									new Notice(
										"At least one divider must be chosen",
										2000,
									);
									component.setValue(
										this.settings.defFileParseConfig.divider
											.dash,
									);
									return;
								}
								this.settings.defFileParseConfig.divider.dash =
									value;
								await this.saveCallback();
							});
						});
					new Setting(modal.contentEl)
						.setName("Underscore")
						.setDesc("Use triple underscore (___) as divider")
						.addToggle((component) => {
							component.setValue(
								this.settings.defFileParseConfig.divider
									.underscore,
							);
							component.onChange(async (value) => {
								if (
									!value &&
									!this.settings.defFileParseConfig.divider
										.dash
								) {
									new Notice(
										"At least one divider must be chosen",
										2000,
									);
									component.setValue(
										this.settings.defFileParseConfig.divider
											.underscore,
									);
									return;
								}
								this.settings.defFileParseConfig.divider.underscore =
									value;
								await this.saveCallback();
							});
						});
					modal.open();
				});
			});

		new Setting(containerEl)
			.setName("Default definition file type")
			.setDesc(
				"When the 'def-type' frontmatter is not specified, the definition file will be treated as this configured default file type.",
			)
			.addDropdown((component) => {
				component.addOption(DefFileType.Consolidated, "consolidated");
				component.addOption(DefFileType.Atomic, "atomic");
				component.setValue(
					this.settings.defFileParseConfig.defaultFileType ??
						DefFileType.Consolidated,
				);
				component.onChange(async (val) => {
					this.settings.defFileParseConfig.defaultFileType =
						val as DefFileType;
					await this.saveCallback();
				});
			});

		new Setting(containerEl)
			.setName("Automatically detect plurals -- English only")
			.setDesc(
				"Attempt to automatically generate aliases for words using English pluralisation rules",
			)
			.addToggle((component) => {
				component.setValue(
					this.settings.defFileParseConfig.autoPlurals,
				);
				component.onChange(async (val) => {
					this.settings.defFileParseConfig.autoPlurals = val;
					await this.saveCallback();
				});
			});

		new Setting(containerEl)
			.setHeading()
			.setName("Definition Popover Settings");

		new Setting(containerEl)
			.setName("Definition popover display event")
			.setDesc(
				"Choose the trigger event for displaying the definition popover",
			)
			.addDropdown((component) => {
				component.addOption(PopoverEventSettings.Hover, "Hover");
				component.addOption(PopoverEventSettings.Click, "Click");
				component.setValue(this.settings.popoverEvent);
				component.onChange(async (value) => {
					if (
						value === PopoverEventSettings.Hover ||
						value === PopoverEventSettings.Click
					) {
						this.settings.popoverEvent = value;
					}
					if (
						this.settings.popoverEvent ===
						PopoverEventSettings.Click
					) {
						this.settings.defPopoverConfig.popoverDismissEvent =
							PopoverDismissType.Click;
					}
					await this.saveCallback();
					this.display();
				});
			});

		if (this.settings.popoverEvent === PopoverEventSettings.Hover) {
			new Setting(containerEl)
				.setName("Definition popover dismiss event")
				.setDesc(
					"Configure the manner in which you would like to close/dismiss the definition popover.",
				)
				.addDropdown((component) => {
					component.addOption(PopoverDismissType.Click, "Click");
					component.addOption(
						PopoverDismissType.MouseExit,
						"Mouse exit",
					);
					if (!this.settings.defPopoverConfig.popoverDismissEvent) {
						this.settings.defPopoverConfig.popoverDismissEvent =
							PopoverDismissType.Click;
						this.saveCallback();
					}
					component.setValue(
						this.settings.defPopoverConfig.popoverDismissEvent,
					);
					component.onChange(async (value) => {
						if (
							value === PopoverDismissType.MouseExit ||
							value === PopoverDismissType.Click
						) {
							this.settings.defPopoverConfig.popoverDismissEvent =
								value;
						}
						await this.saveCallback();
					});
				});
		}

		new Setting(containerEl)
			.setName("Display aliases")
			.setDesc(
				"Display the list of aliases configured for the definition",
			)
			.addToggle((component) => {
				component.setValue(
					this.settings.defPopoverConfig.displayAliases,
				);
				component.onChange(async (value) => {
					this.settings.defPopoverConfig.displayAliases = value;
					await this.saveCallback();
				});
			});

		new Setting(containerEl)
			.setName("Display definition source file")
			.setDesc("Display the title of the definition's source file")
			.addToggle((component) => {
				component.setValue(
					this.settings.defPopoverConfig.displayDefFileName,
				);
				component.onChange(async (value) => {
					this.settings.defPopoverConfig.displayDefFileName = value;
					await this.saveCallback();
				});
			});

		new Setting(containerEl)
			.setName("Custom popover size")
			.setDesc(
				"Customise the maximum popover size. This is not recommended as it prevents dynamic sizing of the popover based on your viewport.",
			)
			.addToggle((component) => {
				component.setValue(
					this.settings.defPopoverConfig.enableCustomSize,
				);
				component.onChange(async (value) => {
					this.settings.defPopoverConfig.enableCustomSize = value;
					await this.saveCallback();
					this.display();
				});
			});

		if (this.settings.defPopoverConfig.enableCustomSize) {
			new Setting(containerEl)
				.setName("Popover width (px)")
				.setDesc("Maximum width of the definition popover")
				.addSlider((component) => {
					component.setLimits(150, window.innerWidth, 1);
					component.setValue(this.settings.defPopoverConfig.maxWidth);
					component.setDynamicTooltip();
					component.onChange(async (val) => {
						this.settings.defPopoverConfig.maxWidth = val;
						await this.saveCallback();
					});
				});

			new Setting(containerEl)
				.setName("Popover height (px)")
				.setDesc("Maximum height of the definition popover")
				.addSlider((component) => {
					component.setLimits(150, window.innerHeight, 1);
					component.setValue(
						this.settings.defPopoverConfig.maxHeight,
					);
					component.setDynamicTooltip();
					component.onChange(async (val) => {
						this.settings.defPopoverConfig.maxHeight = val;
						await this.saveCallback();
					});
				});
		}

		new Setting(containerEl)
			.setName("Enable definition links")
			.setDesc(
				"Definitions within popovers will be marked and can be clicked to go to definition.",
			)
			.addToggle((component) => {
				component.setValue(
					this.settings.defPopoverConfig.enableDefinitionLink,
				);
				component.onChange(async (val) => {
					this.settings.defPopoverConfig.enableDefinitionLink = val;
					await this.saveCallback();
				});
			});

		new Setting(containerEl)
			.setName("Background colour")
			.setDesc(
				"Customise the background colour of the definition popover",
			)
			.addExtraButton((component) => {
				component.setIcon("rotate-ccw");
				component.setTooltip("Reset to default colour set by theme");
				component.onClick(async () => {
					this.settings.defPopoverConfig.backgroundColour = undefined;
					await this.saveCallback();
					this.display();
				});
			})
			.addColorPicker((component) => {
				if (this.settings.defPopoverConfig.backgroundColour) {
					component.setValue(
						this.settings.defPopoverConfig.backgroundColour,
					);
				}
				component.onChange(async (val) => {
					this.settings.defPopoverConfig.backgroundColour = val;
					await this.saveCallback();
				});
			});
	}

	private openTagContextModal() {
		const modal = new Modal(this.app);
		modal.setTitle("Tag definition contexts");

		const render = () => {
			modal.contentEl.empty();
			this.settings.tagDefinitionContexts ??= [];

			const links = this.settings.tagDefinitionContexts;
			if (links.length === 0) {
				modal.contentEl.createDiv({
					text: "No tag definition contexts configured.",
				});
			} else {
				links.forEach((link, idx) => {
					new Setting(modal.contentEl)
						.setName(link.tag)
						.setDesc(link.path)
						.addExtraButton((component) => {
							component
								.setIcon("trash")
								.setTooltip("Remove")
								.onClick(async () => {
									this.settings.tagDefinitionContexts =
										links.filter((_, i) => i !== idx);
									await this.saveCallback();
									render();
								});
						});
				});
			}

			new Setting(modal.contentEl)
				.setName("Add tag context")
				.setHeading();

			const contextOptions = this.getDefinitionContextOptions();
			let tag = "";
			let path = contextOptions[0] ?? "";

			new Setting(modal.contentEl)
				.setName("Tag")
				.setDesc("Use the note tag that should activate this context.")
				.addText((component) => {
					component
						.setPlaceholder("#math/discrete-math")
						.onChange((value) => {
							tag = value;
						});
				});

			new Setting(modal.contentEl)
				.setName("Definition context")
				.setDesc("Choose a definition file or folder.")
				.addDropdown((component) => {
					contextOptions.forEach((option) => {
						component.addOption(option, option);
					});
					if (path) {
						component.setValue(path);
					}
					component.onChange((value) => {
						path = value;
					});
				});

			new Setting(modal.contentEl).addButton((component) => {
				component.setButtonText("Add").onClick(async () => {
					const normalisedTag = normaliseTag(tag);
					if (!normalisedTag) {
						new Notice("Please enter a tag.");
						return;
					}
					if (!path) {
						new Notice("Please choose a definition context.");
						return;
					}
					const alreadyExists =
						this.settings.tagDefinitionContexts.some(
							(ctx) =>
								normaliseTag(ctx.tag) === normalisedTag &&
								ctx.path === path,
						);
					if (alreadyExists) {
						new Notice("Tag definition context already exists.");
						return;
					}

					this.settings.tagDefinitionContexts = [
						...this.settings.tagDefinitionContexts,
						{
							tag: normalisedTag,
							path,
						},
					];
					await this.saveCallback();
					render();
				});
			});
		};

		render();
		modal.open();
	}

	private getDefinitionContextOptions(): string[] {
		const root = this.app.vault.getFolderByPath(
			this.settings.defFolder || DEFAULT_DEF_FOLDER,
		);
		if (!root) {
			return [];
		}

		const options: string[] = [];
		const walk = (folder: TFolder) => {
			options.push(`${folder.path}/`);
			folder.children.forEach((child) => {
				if (child instanceof TFolder) {
					walk(child);
				} else if (
					child instanceof TFile &&
					VALID_DEFINITION_FILE_TYPES.some((ext) =>
						child.path.endsWith(ext),
					)
				) {
					options.push(child.path);
				}
			});
		};

		walk(root);
		return options;
	}
}

export function getSettings(): Settings {
	return window.NoteDefinition.settings;
}
