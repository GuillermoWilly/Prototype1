// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
/**
 * @param {vscode.ExtensionContext} context
 */

const vscode = require('vscode');
const path = require('path');
const { loadPyodide } = require("pyodide");

let globalPyodideInstance = null;
let packagesLoaded = false;

let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        statusBarItem.text = "$(sync~spin) Processing...";


async function getPyodideInstance(context) {
    let pyodidePath="file:///"+context.asAbsolutePath(path.join('files','pyodide'));
    console.log(pyodidePath);
    if (!globalPyodideInstance) {
        globalPyodideInstance = await loadPyodide(
            {
                indexURL: pyodidePath,
            }
        );
    }
    return globalPyodideInstance;
}

function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "Prototype1" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('Prototype1.helloWorld', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		//vscode.window.showInformationMessage('Hello World from Prototype1!');
		var panel = vscode.window.createWebviewPanel(
			'Prototype1',
			'Vs code prototype for tfg',
			vscode.ViewColumn.One,
			{enableScripts:true}
		);
		const styleUri = panel.webview.asWebviewUri(
            vscode.Uri.joinPath(context.extensionUri, 'media', 'style.css')
        );
		panel.webview.html = getWebviewContent(styleUri);

		panel.webview.onDidReceiveMessage(message=>{
			switch(message.command){
				case 'alert':
					vscode.window.showInformationMessage(message.text);
					return;
			}
		});

	});

	context.subscriptions.push(disposable);
}

function getWebviewContent(styleUri){
	const html = `
    <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FlampyD2</title>
    <script type="module" crossorigin="" src="/assets/index-D9-te1zz.js"></script>
    <link rel="stylesheet" href="${styleUri}">
  </head>
  <body>
    <div id="root">
      <div class="h-screen w-screen flex flex-col">
        <nav class="flex justify-between items-center py-4 px-6 bg-white shadow">
          <div class="flex gap-4 items-center"></div>
          <div class="flex gap-4 items-center"></div>
        </nav>
        <div class="flex items-center justify-center h-screen">
          <div class="flex flex-col items-center space-y-4">
            <button class="w-full bg-[#35C99] text-white py-2 px-4 rounded active:bg-[#4048C] shadow-lg">Create new model</button>
            <input id="fileInput" type="file" style="display: none;">
            <button class="w-full bg-[#35C99] text-white py-2 px-4 rounded shadow-lg">Import model</button>
            <button class="w-full bg-[#35C99] text-white py-2 px-4 rounded shadow-lg">Start from a sample model</button>
            <div class="text-center text-sm italic"></div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
  `;
  return html;

}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
