import { TreeItem, TreeItemCollapsibleState } from "./TreeItem";
import { ContextValues } from "./ContextValues";
import { ProjectInSolution } from "../model/Solutions";
import { Project } from "../model/Projects";
import { ProjectReferencedProjectTreeItem } from "./ProjectReferencedProjectTreeItem";
import * as TreeItemFactory from "./TreeItemFactory";

export class ProjectFolderTreeItem extends TreeItem {
    private children: TreeItem[] = null;

    constructor(name: string, path:string, private readonly project: Project) {
        super(name, TreeItemCollapsibleState.Collapsed, ContextValues.ProjectFolder, path);
    }

    public getChildren(): Thenable<TreeItem[]> {
        if (this.children) {
            return Promise.resolve(this.children);
        }

        this.children = [];

        TreeItemFactory.CreateItemsFromProject(this.project, this.path).forEach(item => this.children.push(item));
        
        return Promise.resolve(this.children);
    }
}