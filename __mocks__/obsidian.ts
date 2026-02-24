export class App {
	vault: Vault;
	metadataCache: MetadataCache;

	constructor() {
		this.vault = new Vault();
		this.metadataCache = new MetadataCache();
	}
}

export class TFile {
	basename: string;
	extension: string;
	
	// Ignore other properties
}

export class PluginSettingTab {}

export class Vault {
	modify(file: TFile, data: string) {}
	read(file: TFile): Promise<string> {
		return Promise.resolve("");
	}
}

export class MetadataCache {
	getFileCache(file: TFile) {
		return null;
	}
}

export class Notice {}
