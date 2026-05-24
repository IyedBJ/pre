const fs = require('fs');
const path = require('path');

const replacers = [
    { from: /"\/invoices"/g, to: '"/factures"' },
    { from: /"\/invoices/g, to: '"/factures' }, // catching "/invoices/..."
    { from: /'\/invoices/g, to: "'/factures" },
    { from: /`\/invoices/g, to: "`/factures" },
    
    { from: /"\/projects"/g, to: '"/projets"' },
    { from: /"\/projects/g, to: '"/projets' },
    { from: /'\/projects/g, to: "'/projets" },
    { from: /`\/projects/g, to: "`/projets" },
    
    { from: /"\/employees"/g, to: '"/employes"' },
    { from: /"\/employees/g, to: '"/employes' },
    { from: /'\/employees/g, to: "'/employes" },
    { from: /`\/employees/g, to: "`/employes" },
    
    { from: /"\/monthly-data"/g, to: '"/donnees-mensuelles"' },
    { from: /"\/monthly-data/g, to: '"/donnees-mensuelles' },
    { from: /'\/monthly-data/g, to: "'/donnees-mensuelles" },
    { from: /`\/monthly-data/g, to: "`/donnees-mensuelles" },
    
    { from: /"\/config"/g, to: '"/configurations"' },
    { from: /"\/config/g, to: '"/configurations' },
    { from: /'\/config/g, to: "'/configurations" },
    { from: /`\/config/g, to: "`/configurations" },
    
    { from: /"\/users"/g, to: '"/utilisateurs"' },
    { from: /"\/users/g, to: '"/utilisateurs' },
    { from: /'\/users/g, to: "'/utilisateurs" },
    { from: /`\/users/g, to: "`/utilisateurs" }
];

function processDirectory(directory) {
    const files = fs.readdirSync(directory);
    for (const file of files) {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules') processDirectory(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            for (const { from, to } of replacers) {
                if (content.match(from)) {
                    content = content.replace(from, to);
                    modified = true;
                }
            }
            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

processDirectory('./src');
console.log('Frontend API renames complete.');
