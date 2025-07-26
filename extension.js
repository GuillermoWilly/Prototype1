// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
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
		vscode.window.showInformationMessage('Hello World from Prototype1!');
		var panel = vscode.window.createWebviewPanel(
			'Prototype1',
			'Vs code prototype for tfg',
			vscode.ViewColumn.One,
			{}
		)
		panel.webview.html = getWebviewContent();

	});

	context.subscriptions.push(disposable);
}

function getWebviewContent(){
	const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Testing Prototype1</title>
      <style>
        body {
          font-family: sans-serif;
          text-align: center;
          padding: 50px;
        }
        h1 {
          color: #3498db;
        }
      </style>
    </head>
    <body>
      <h1>Hello World!</h1>
      <p>Created for TFG.</p>
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
