import * as vscode from "vscode";
import { ICommandParameter } from "../base/ICommandParameter";

export class InputOptionsCommandParameter implements ICommandParameter {
    private value: string;

    constructor(private readonly placeholder: string, private readonly items:string[], private readonly option?: string) {
    }

    public async setArguments(): Promise<boolean> {
        let value = await vscode.window.showQuickPick(this.items, { placeHolder: this.placeholder });
        if (value !== null && value !== undefined) {
            this.value = value;
            return true;
        }

        return false;
    }

    public getArguments(): string[] {
        if (this.option)
            return [ this.option, this.value ];

        return [ this.value ];
    }

}