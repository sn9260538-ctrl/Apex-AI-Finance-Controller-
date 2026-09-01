const fs = require('fs');

const replaceInFile = (file, from, to) => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(new RegExp(from, 'g'), to);
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
}

replaceInFile('src/context/FinanceDataContext.tsx', 'Ledgerly', 'Apex');
replaceInFile('src/components/ReconciliationTab.tsx', 'Ledgerly', 'Apex');
replaceInFile('src/App.tsx', 'Ledgerly', 'Apex');
replaceInFile('metadata.json', 'Ledgerly', 'Apex');
replaceInFile('index.html', 'Ledgerly', 'Apex');

