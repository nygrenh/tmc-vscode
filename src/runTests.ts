import * as vscode from "vscode";
import tmcLangs from "./tmcLangs";

export async function activate() {
  vscode.commands.registerCommand("tmcExtension.runTests", async () => {
    const currentDocumentUri = vscode.window.activeTextEditor.document.uri;
    const currentWorkspace = vscode.workspace.getWorkspaceFolder(
      currentDocumentUri
    );
    const currentWorspacePath = currentWorkspace.uri.fsPath;

    const langs = await tmcLangs();
    try {
      console.log("Foo");
      const output = await langs.runTests(currentWorspacePath);
      const resultsPanel = vscode.window.createWebviewPanel(
        "testResults",
        "Test results",
        vscode.ViewColumn.One,
        {}
      );
      resultsPanel.webview.html = resultTemplate(output);
      console.log("Bar");
    } catch (e) {
      console.error("Failed to run tests", e);
    }
  });
}

function resultTemplate(results: string) {
  const obj = JSON.parse(results);
  const pretty = JSON.stringify(obj, null, 4);
  const testResults: [any] = obj.testResults;
  const passedResults = testResults.filter(o => o.successful);
  const firstFailure = testResults.find(o => !o.successful);

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test results</title>
  </head>
  <body>
    <h1>Test results</h1>
    <p>Status: ${obj.status}</p>
    <p>${passedResults.length}/${testResults.length} passed</p>
    ${firstFailure &&
      `<p><b>${firstFailure.name}</b>: ${firstFailure.message}</p>`}
    <pre><code>${pretty}</code></pre>
  </body>
  </html>`;
}
