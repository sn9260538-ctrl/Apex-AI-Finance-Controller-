const fs = require('fs');
let content = fs.readFileSync('src/components/ReconciliationTab.tsx', 'utf8');

const overlay = `    {isProcessing && (
      <div className="fixed inset-0 z-[100] bg-neu-base/90 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
        <div className="flex flex-col items-center gap-8 p-12 bg-neu-base rounded-[40px] shadow-neu-extruded">
          <div className="w-24 h-24 rounded-[24px] bg-[#9EEB75] shadow-neu-extruded flex items-center justify-center text-[#0F2F28] animate-pulse">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.5 8.5C6.5 7.5 8 8 9 9.5C10 11.5 11 15 12.5 18C10.5 15.5 8.5 11.5 7 10C6 9 5 8.5 5.5 8.5Z" />
              <path d="M9.5 10.5C12 9 15 7 18.5 5.5C15.5 8 12.5 9.5 9.5 10.5Z" />
              <path d="M11 12.5C13.5 11.5 16 10 18.5 9C16 11.5 13.5 12.5 11 12.5Z" />
            </svg>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl font-display font-extrabold tracking-tight text-neu-primary">Ledgerly</h1>
            <p className="text-sm text-neu-muted font-bold tracking-widest uppercase mt-2">Controller</p>
          </div>

          <div className="mt-4 flex flex-col items-center w-64 gap-6">
             <p className="text-sm font-bold text-neu-primary animate-pulse">Running deterministic match...</p>
             <div className="w-full h-4 bg-neu-base shadow-neu-inset rounded-full overflow-hidden relative">
                <div 
                  className="absolute inset-y-0 left-0 bg-neu-accent transition-all duration-100 ease-linear shadow-neu-extruded-sm"
                  style={{ width: \`\${progress}%\` }}
                ></div>
             </div>
             <p className="text-xs font-bold text-neu-muted tabular-nums">{progress}%</p>
          </div>
        </div>
      </div>
    )}`;

const target = '  return (\n    <div className="space-y-8 animate-fade-in pb-20">';
const replacement = target + '\n' + overlay;

if(content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/components/ReconciliationTab.tsx', content);
    console.log('Successfully added overlay');
} else {
    console.log('Target content not found.');
}
