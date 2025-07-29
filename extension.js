const vscode = require('vscode');
const path = require('path');
let globalPyodideInstance = null;
let packagesLoaded = false;

let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
statusBarItem.text = "$(sync~spin) Processing...";

async function getPyodideInstance(context) {
    let pyodidePath = "file:///" + context.asAbsolutePath(path.join('files', 'pyodide'));
    console.log(pyodidePath);
    if (!globalPyodideInstance) {
        const { loadPyodide } = require("pyodide");
        globalPyodideInstance = await loadPyodide({
            indexURL: pyodidePath,
        });
    }
    return globalPyodideInstance;
}

async function ensurePackagesLoaded(pyodide, context) {
    if (!packagesLoaded) {
        statusBarItem.show();
        await pyodide.loadPackage(['micropip']);
        const micropip = pyodide.pyimport("micropip");
        await micropip.install("file:///" + context.asAbsolutePath(path.join('files', 'wheels', "six-1.16.0-py2.py3-none-any.whl")));
        await micropip.install("file:///" + context.asAbsolutePath(path.join('files', 'wheels', "certifi-2023.7.22-py3-none-any.whl")));
        await micropip.install("file:///" + context.asAbsolutePath(path.join('files', 'wheels', "idna-3.4-py3-none-any.whl")));
        await micropip.install("file:///" + context.asAbsolutePath(path.join('files', 'wheels', "antlr4_python3_runtime-4.7.2-py3-none-any.whl")));
        await micropip.install("file:///" + context.asAbsolutePath(path.join('files', 'wheels', "antlr_denter-1.3.1-py3-none-any.whl")));
        await micropip.install("file:///" + context.asAbsolutePath(path.join('files', 'wheels', "afmparser-1.0.0-py3-none-any.whl")));
        await micropip.install("file:///" + context.asAbsolutePath(path.join('files', 'wheels', "uvlparser-1.0.2-py3-none-any.whl")));
        await micropip.install("file:///" + context.asAbsolutePath(path.join('files', 'wheels', "flamapy-1.1.3-py3-none-any.whl")));
        await micropip.install("file:///" + context.asAbsolutePath(path.join('files', 'wheels', "flamapy_fm-1.1.3-py3-none-any.whl")));
        await micropip.install("file:///" + context.asAbsolutePath(path.join('files', 'wheels', "flamapy_sat-1.1.7-py3-none-any.whl")));
        let flamapy_fm_dist = "file:///" + context.asAbsolutePath(path.join('files', 'wheels', "flamapy_fm_dist-1.6.0-py3-none-any.whl"));
        await pyodide.runPythonAsync(`
        import micropip
        await micropip.install("${flamapy_fm_dist}", deps=False)
        `);
        packagesLoaded = true;
        statusBarItem.hide();
    }
}

function getActiveFileContent() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const document = editor.document;
        return document.getText();
    } else {
        console.error("No active editor!");
        return null;
    }
}

async function exec_python(code, context) {
    const pyodide = await getPyodideInstance(context);
    if (packagesLoaded == false) {
        vscode.window.showWarningMessage('Pyodide and Flama are not yet loaded. Please wait!');
        return null;
    }
    await ensurePackagesLoaded(pyodide, context);
    let uvl_file = getActiveFileContent();
    if (uvl_file == null) {
        vscode.window.showWarningMessage('No active UVL file. Cannot execute the operation!');
        return null;
    }
    pyodide.FS.writeFile("uvlfile.uvl", uvl_file, { encoding: "utf8" });
    return pyodide.runPythonAsync(
        `
        from flamapy.interfaces.python.FLAMAFeatureModel import FLAMAFeatureModel
        fm = FLAMAFeatureModel("uvlfile.uvl")
        ` + code
    );
}

class ButtonProvider {
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            return [
                this.createButton('Products', 'flamapy.products'),
                this.createButton('Valid', 'flamapy.valid'),
                this.createButton('Atomic Sets', 'flamapy.atomic_sets'),
                this.createButton('Avg Branching Factor', 'flamapy.average_branching_factor'),
                this.createButton('Count Leafs', 'flamapy.count_leafs'),
                this.createButton('Estimated #Configurations', 'flamapy.estimated_number_of_products'),
                this.createButton('Leaf feature lists', 'flamapy.leaf_features'),
                this.createButton('Max Depth', 'flamapy.max_depth'),
                this.createButton('Core Features', 'flamapy.core_features'),
                this.createButton('Dead Features', 'flamapy.dead_features'),
                this.createButton('Error detection', 'flamapy.error_detection'),
                this.createButton('False Optional Features', 'flamapy.false_optional_features'),
                this.createButton('#Configurations', 'flamapy.products_number')
            ];
        }
        return [];
    }
    createButton(label, command) {
        const treeItem = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
        treeItem.command = {
            command: command,
            title: label,
            arguments: []
        };
        return treeItem;
    }
}

function createCommand(id, code, result_header, context) {
    let command = vscode.commands.registerCommand(id, function () {
        statusBarItem.show();
        exec_python(code, context).then((result) => {
            if (result != null) {
                const panel = vscode.window.createWebviewPanel(
                    'resultDisplay',
                    result_header,
                    vscode.ViewColumn.Two,
                    {}
                );
                panel.webview.html = `<html><body>${result}</body></html>`;
            }
            statusBarItem.hide();
        });
    });
    return command;
}

function activate(context) {
    // Hello World command and webview
    const disposable = vscode.commands.registerCommand('Prototype1.helloWorld', function () {
        vscode.window.showInformationMessage('Hello World from Prototype1!');
        var panel = vscode.window.createWebviewPanel(
            'Prototype1',
            'Vs code prototype for tfg',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );
        panel.webview.html = getWebviewContent();
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'alert':
                    vscode.window.showInformationMessage(message.text);
                    return;
            }
        });
    });
    context.subscriptions.push(disposable);

    // Flama tree and commands
    const provider = new ButtonProvider();
    vscode.window.registerTreeDataProvider('flamaView', provider);
    vscode.commands.executeCommand('setContext', 'flamaPackagesLoaded', false);

    // Start loading pyodide/flama
    (async () => {
        try {
            vscode.window.showInformationMessage('Loading Pyodide and Flama packages');
            const pyodide = await getPyodideInstance(context);
            ensurePackagesLoaded(pyodide, context).then(() => {
                vscode.window.showInformationMessage('Done Loading Pyodide and Flama packages');
            });
        } catch (error) {
            console.error("Error initializing Pyodide and Flama:", error);
        }
    })();

    // Register Flama commands
    let flamapy_products = createCommand(
        'flamapy.products',
        `
        result=fm.products()
        "<br>".join([f'P({i}): {p}' for i, p in enumerate(result, 1)])    
        `,
        'Products Result',
        context
    );
    let flamapy_valid = createCommand(
        'flamapy.valid',
        `
        result=fm.valid()
        "The feature model is valid? " + str(result)
        `,
        'Valid Result',
        context
    );
    let flamapy_dead_features = createCommand(
        'flamapy.dead_features',
        `
        result=fm.dead_features()
        "<br>".join([f'F({i}): {p}' for i, p in enumerate(result, 1)])    
        `,
        'Dead Features Result',
        context
    );
    let flamapy_false_optional_features = createCommand(
        'flamapy.false_optional_features',
        `
        result=fm.false_optional_features()
        "<br>".join([f'F({i}): {p}' for i, p in enumerate(result, 1)])    
        `,
        'False Optional Features Result',
        context
    );
    let flamapy_core_features = createCommand(
        'flamapy.core_features',
        `
        result=fm.core_features()
        "<br>".join([f'F({i}): {p}' for i, p in enumerate(result, 1)])    
        `,
        'Core Features Result',
        context
    );
    let flamapy_atomic_sets = createCommand(
        'flamapy.atomic_sets',
        `
        result=fm.atomic_sets()
        "<br>".join([f'AS({i}): {p}' for i, p in enumerate(result, 1)])    
        `,
        'Atomix Sets Result',
        context
    );
    let flamapy_average_branching_factor = createCommand(
        'flamapy.average_branching_factor',
        `
        result=fm.average_branching_factor()
        "<br>"+str(result)
        `,
        'Avg Branching Factor Result',
        context
    );
    let flamapy_count_leafs = createCommand(
        'flamapy.count_leafs',
        `
        result=fm.count_leafs()
        "<br>"+str(result)
        `,
        'Count leafs Result',
        context
    );
    let flamapy_estimated_number_of_products = createCommand(
        'flamapy.estimated_number_of_products',
        `
        result=fm.estimated_number_of_products()
        "<br>"+str(result)
        `,
        'Estimated #Configurations Result',
        context
    );
    let flamapy_leaf_features = createCommand(
        'flamapy.leaf_features',
        `
        result=fm.leaf_features()
        "<br>".join([f'AS({i}): {p}' for i, p in enumerate(result, 1)])    
        `,
        'Leaf Features Result',
        context
    );
    let flamapy_max_depth = createCommand(
        'flamapy.max_depth',
        `
        result=fm.max_depth()
        "<br>"+str(result)
        `,
        'Max Depth Result',
        context
    );
    let flamapy_error_detection = createCommand(
        'flamapy.error_detection',
        `
        result=fm.max_depth()
        "<br>"+str(result)
        `,
        'Errors Result',
        context
    );
    let flamapy_products_number = createCommand(
        'flamapy.products_number',
        `
        result=fm.products_number()
        "<br>"+str(result)
        `,
        '#Configurations Result',
        context
    );

    context.subscriptions.push(
        flamapy_products,
        flamapy_valid,
        flamapy_atomic_sets,
        flamapy_average_branching_factor,
        flamapy_count_leafs,
        flamapy_estimated_number_of_products,
        flamapy_leaf_features,
        flamapy_max_depth,
        flamapy_core_features,
        flamapy_dead_features,
        flamapy_error_detection,
        flamapy_false_optional_features,
        flamapy_products_number
    );
}

function getWebviewContent() {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Testing Prototype1</title>
      <script>
        const vscode = acquireVsCodeApi();
        document.addEventListener('DOMContentLoaded', function() {
            const p1 = document.getElementById('p1');
            p1.style.color = 'green';
            const button1 = document.getElementById('button1');
            button1.style.color = 'red';
        });
      </script>	
    </head>
    <body>
      <h1>Hello World</h1>
      <p id='p1'>Created for TFG</p>
      <button id='button1' type="Call extension.js" value="Call extension.js" onclick="vscode.postMessage({command: 'alert', text: 'Si ves esto es que funciona'});"> Click for alert </button>
    </body>
    </html>
  `;
    return html;
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};