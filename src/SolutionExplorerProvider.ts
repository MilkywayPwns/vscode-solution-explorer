import * as vscode from "vscode";
import * as fs from "./async/fs";
import * as path from "path";
import * as sln from "./tree";
import * as SolutionExplorerConfiguration from "./SolutionExplorerConfiguration";
import * as Utilities from "./model/Utilities";
import { SolutionFile } from "./model/Solutions";
import { IEventAggegator, EventTypes, IEvent, ISubscription, IFileEvent } from "./events";
import { ILogger, Logger } from "./log";
import { ITemplateEngine, TemplateEngine } from "./templates";

export class SolutionExplorerProvider implements vscode.TreeDataProvider<sln.TreeItem> {
	private _logger: ILogger;
	private _templateEngine: ITemplateEngine;
	private subscription: ISubscription = null;
	private children: sln.TreeItem[] = null;
	private _onDidChangeTreeData: vscode.EventEmitter<sln.TreeItem | undefined> = new vscode.EventEmitter<sln.TreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<sln.TreeItem | undefined> = this._onDidChangeTreeData.event;
	//onDidChangeActiveTextEditor

	constructor(public workspaceRoot: string, public readonly eventAggregator: IEventAggegator) {
		this._logger = new Logger(this.eventAggregator);
		this._templateEngine = new TemplateEngine(workspaceRoot);
	}

	public get logger(): ILogger {
		return this._logger;
	}

	public get templateEngine(): ITemplateEngine {
		return this._templateEngine;
	}

	public register() {
		if (SolutionExplorerConfiguration.getShowInExplorer()) {
			this.subscription = this.eventAggregator.subscribe(EventTypes.File, evt => this.onFileEvent(evt))
			vscode.window.registerTreeDataProvider('solutionExplorer', this);
		}
	}

	public unregister() {
		if (SolutionExplorerConfiguration.getShowInExplorer()) {
			this.subscription.dispose();
			this.subscription = null;
		}
	}

	public refresh(item?: sln.TreeItem): void {
		if (item) {
			this._onDidChangeTreeData.fire(item);
		} else {
			this.children = null;
			this._onDidChangeTreeData.fire();
		}
	}

	public getTreeItem(element: sln.TreeItem): vscode.TreeItem {
		return element;
	}

	public getChildren(element?: sln.TreeItem): Thenable<sln.TreeItem[]> {
		if (!this.workspaceRoot) {
			this.logger.log('No .sln found in workspace');
			return Promise.resolve([]);
		}
		
		if (element)
			return element.getChildren();
		
		if (!element && this.children) 
			return Promise.resolve(this.children);
	
		if (!element && !this.children) {
			return this.createSolutionItems();
		}

		return null;
	}

	private async createSolutionItems(): Promise<sln.TreeItem[]> {
		this.children = [];
		let solutionPaths = await Utilities.searchFilesInDir(this.workspaceRoot, '.sln');
		if (solutionPaths.length <= 0) {
			this.children .push(await sln.CreateNoSolution(this, this.workspaceRoot));
			return this.children;
		}
		
		for(let i = 0; i < solutionPaths.length; i++) {
			let s = solutionPaths[i];
			let solution = await SolutionFile.Parse(s);
			let item = await sln.CreateFromSolution(this, solution);
			this.children.push(item);
		}

		if (this.children.length > 0) this.checkTemplatesToInstall();

		return this.children;
	}

	private onFileEvent(event: IEvent): void {
        let fileEvent = <IFileEvent> event;

		if (path.dirname(fileEvent.path) == this.workspaceRoot 
		    && fileEvent.path.endsWith('.sln')) {
			this.children = null;
			this.refresh();
        }
	}

	private async checkTemplatesToInstall(): Promise<void> {
		if (!(await this.templateEngine.existsTemplates())) {
			let option = await vscode.window.showWarningMessage("Would you like to create the vscode-solution-explorer templates folder?", 'Yes', 'No');
			if (option !== null && option !== undefined && option == 'Yes') {
				await this.templateEngine.creteTemplates();
			}
		}
	}
}








