const fs = require('fs');
let content = fs.readFileSync('src/components/OverviewTab.tsx', 'utf8');

const target = `        <div className="p-6 bg-neu-base rounded-[24px] shadow-neu-extruded flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full shadow-neu-inset flex items-center justify-center text-neu-primary">
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-neu-muted">Confirmed Bank Cash</p>
          </div>
          <p className="text-2xl font-display font-extrabold text-neu-primary mb-1">`;

const replacement = `        <div className="p-6 bg-neu-base rounded-[24px] shadow-neu-extruded flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full shadow-neu-inset flex items-center justify-center text-[#9EEB75]">
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-[#9EEB75]">Confirmed Bank Cash</p>
          </div>
          <p className="text-2xl font-display font-extrabold text-[#9EEB75] mb-1">`;

if(content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/components/OverviewTab.tsx', content);
    console.log('Successfully colored it green.');
} else {
    console.log('Target content not found.');
}
