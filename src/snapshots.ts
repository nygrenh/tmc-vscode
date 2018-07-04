import * as vscode from "vscode";

export function activate() {
  vscode.workspace.onDidChangeTextDocument(event => {
    //console.log(JSON.stringify(event));
  });
}
