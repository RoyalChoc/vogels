const vscode = require('vscode');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function activate(context) {
    let disposable = vscode.commands.registerCommand('splendid-gencalc.openCalculator', function () {
        const panel = vscode.window.createWebviewPanel(
            'splendidGenCalc',
            'Splendid GenCalc',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [context.extensionUri]
            }
        );

        panel.webview.html = getWebviewContent();

        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'bereken':
                        const dataPath = path.join(context.extensionPath, 'kweekpaar.json');
                        fs.writeFileSync(dataPath, JSON.stringify(message.data, null, 2), 'utf8');

                        const pythonScriptPath = path.join(context.extensionPath, 'calculator.py');
                        
                        exec(`python "${pythonScriptPath}"`, (error, stdout, stderr) => {
                            if (error || stderr) {
                                panel.webview.postMessage({ 
                                    command: 'resultaat', 
                                    status: 'error', 
                                    message: stderr || error.message 
                                });
                                return;
                            }

                            try {
                                const pythonResult = JSON.parse(stdout);
                                panel.webview.postMessage({ 
                                    command: 'resultaat', 
                                    status: 'success',
                                    warnings: pythonResult.warnings,
                                    results: pythonResult.results
                                });
                            } catch (parseError) {
                                panel.webview.postMessage({ 
                                    command: 'resultaat', 
                                    status: 'error', 
                                    message: 'Fout bij het parsen van de Python output.' 
                                });
                            }
                        });
                        return;
                }
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent() {
    return `<!DOCTYPE html>
    <html lang="nl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Splendid GenCalc</title>
        <style>
            body { background-color: var(--vscode-editor-background); color: var(--vscode-editor-foreground); font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); padding: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background-color: var(--vscode-sideBar-background); border: 1px solid var(--vscode-panel-border); padding: 8px; font-weight: 600; }
            td { border: 1px solid var(--vscode-panel-border); padding: 8px; text-align: center; }
            td:first-child { text-align: left; }
            input[type="checkbox"] { accent-color: var(--vscode-button-background); cursor: pointer; }
            button { background-color: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 10px; width: 100%; cursor: pointer; font-weight: bold; margin-top: 15px; }
            button:hover { background-color: var(--vscode-button-hoverBackground); }
            .warning-box { background-color: rgba(255, 165, 0, 0.15); border-left: 4px solid orange; padding: 10px; margin-bottom: 15px; color: #ffb300; }
            .error-box { background-color: rgba(244, 67, 54, 0.15); border-left: 4px solid #f44336; padding: 10px; margin-bottom: 15px; color: #f44336; }
            .results-container { display: flex; gap: 20px; margin-top: 20px; }
            .gender-box { flex: 1; padding: 12px; borderRadius: 4px; background-color: rgba(255,255,255,0.05); }
            ul { padding-left: 20px; margin: 5px 0; }
            li { margin-bottom: 4px; }
        </style>
    </head>
    <body>
        <h2>Splendid Parkiet Genetica Calculator</h2>
        <div id="warnings"></div>
        <div id="error"></div>
        
        <table>
            <thead>
                <tr>
                    <th rowspan="2">Mutatie</th>
                    <th colspan="2">Vader (1.0)</th>
                    <th colspan="2">Moeder (0.1)</th>
                </tr>
                <tr>
                    <th>Visual</th><th>Split</th>
                    <th>Visual</th><th>Split</th>
                </tr>
            </thead>
            <tbody id="mutation-rows"></tbody>
        </table>
        
        <button id="calc-btn">Bereken Uitkomsten</button>
        <div id="results"></div>

        <script>
            const vscode = acquireVsCodeApi();
            const MUTATIONS_DB = {
                "blauw": "Blauw", "aqua": "Aqua (Zeegroen)", "pastelblauw": "Pastelblauw (Turquoise)",
                "opaline": "Opaline (Roodbuik)", "cinnamon": "Cinnamon", "ino": "Ino (Lutino/Rubino)",
                "pallid": "Pallid (Isabel)", "grijsgroen": "Grijsgroen", "donkerfactor": "Donkerfactor"
            };
            
            const vader = { visual: [], split: [] };
            const moeder = { visual: [], split: [] };

            const tbody = document.getElementById('mutation-rows');
            Object.keys(MUTATIONS_DB).forEach(key => {
                const tr = document.createElement('tr');
                tr.innerHTML = \`
                    <td>\${MUTATIONS_DB[key]}</td>
                    <td><input type="checkbox" id="v-vis-\${key}"></td>
                    <td><input type="checkbox" id="v-spl-\${key}"></td>
                    <td><input type="checkbox" id="m-vis-\${key}"></td>
                    <td><input type="checkbox" id="m-spl-\${key}"></td>
                \`;
                tbody.appendChild(tr);

                // Event listeners voor automatische mutatie exclusiviteit (visual/split)
                document.getElementById(\`v-vis-\${key}\`).addEventListener('change', (e) => {
                    if(e.target.checked) document.getElementById(\`v-spl-\${key}\`).checked = false;
                    updateData();
                });
                document.getElementById(\`v-spl-\${key}\`).addEventListener('change', (e) => {
                    if(e.target.checked) document.getElementById(\`v-vis-\${key}\`).checked = false;
                    updateData();
                });
                document.getElementById(\`m-vis-\${key}\`).addEventListener('change', (e) => {
                    if(e.target.checked) document.getElementById(\`m-spl-\${key}\`).checked = false;
                    updateData();
                });
                document.getElementById(\`m-spl-\${key}\`).addEventListener('change', (e) => {
                    if(e.target.checked) document.getElementById(\`m-vis-\${key}\`).checked = false;
                    updateData();
                });
            });

            function updateData() {
                vader.visual = []; vader.split = []; moeder.visual = []; moeder.split = [];
                Object.keys(MUTATIONS_DB).forEach(key => {
                    if(document.getElementById(\`v-vis-\${key}\`).checked) vader.visual.push(key);
                    if(document.getElementById(\`v-spl-\${key}\`).checked) vader.split.push(key);
                    if(document.getElementById(\`m-vis-\${key}\`).checked) moeder.visual.push(key);
                    if(document.getElementById(\`m-spl-\${key}\`).checked) moeder.split.push(key);
                });
            }

            document.getElementById('calc-btn').addEventListener('click', () => {
                updateData();
                document.getElementById('error').innerHTML = '';
                vscode.postMessage({ command: 'bereken', data: { vader, moeder } });
            });

            window.addEventListener('message', event => {
                const message = event.data;
                if (message.command === 'resultaat') {
                    if (message.status === 'success') {
                        // Waarschuwingen renderen
                        const warnDiv = document.getElementById('warnings');
                        warnDiv.innerHTML = message.warnings.map(w => \`<div class="warning-box">\${w}</div>\`).join('');
                        
                        // Resultaten renderen
                        const resDiv = document.getElementById('results');
                        resDiv.innerHTML = \`
                            <h3>Verwachte Jongen</h3>
                            <div class="results-container">
                                <div class="gender-box">
                                    <h4 style="color:#64b5f6;margin:0 0 8px 0;">Zonen (Mannen)</h4>
                                    <ul>\${message.results.zonen.map(r => \`<li>\${r}</li>\`).join('')}</ul>
                                </div>
                                <div class="gender-box">
                                    <h4 style="color:#f06292;margin:0 0 8px 0;">Dochters (Poppen)</h4>
                                    <ul>\${message.results.dochters.map(r => \`<li>\${r}</li>\`).join('')}</ul>
                                </div>
                            </div>
                        \`;
                    } else {
                        document.getElementById('error').innerHTML = \`<div class="error-box">Systeemfout: \${message.message}</div>\`;
                    }
                }
            });
        </script>
    </body>
    </html>`;
}

function deactivate() {}

module.exports = { activate, deactivate };
