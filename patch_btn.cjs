const fs = require('fs');
let content = fs.readFileSync('src/components/ReconciliationTab.tsx', 'utf8');

const target = `<div className="flex justify-center">
        <button 
          onClick={handleRun}
          disabled={isProcessing || (invoices.length === 0 && payments.length === 0)}
          className="px-10 py-4 bg-neu-primary shadow-[12px_12px_24px_rgba(163,177,198,0.5),-12px_-12px_24px_rgba(255,255,255,0.8)] hover:-translate-y-1 active:translate-y-1 rounded-full font-bold text-lg text-neu-base flex items-center gap-3 transition-all disabled:opacity-50"
        >`;

const replacement = `<div className="flex justify-center mt-12 relative">
        <button 
          onClick={handleRun}
          disabled={isProcessing || (invoices.length === 0 && payments.length === 0)}
          className="relative px-10 py-4 bg-neu-primary shadow-[12px_12px_24px_rgba(163,177,198,0.5),-12px_-12px_24px_rgba(255,255,255,0.8)] hover:-translate-y-1 active:translate-y-1 rounded-full font-bold text-lg text-neu-base flex items-center gap-3 transition-all disabled:opacity-50"
        >
          {!(invoices.length === 0 && payments.length === 0) && !isProcessing && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9EEB75] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#9EEB75] border-2 border-neu-primary"></span>
            </span>
          )}`;

if(content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/components/ReconciliationTab.tsx', content);
    console.log('Successfully added green indicator');
} else {
    console.log('Target content not found. Here is what we have:');
    console.log(content.substring(content.indexOf('flex justify-center'), content.indexOf('flex justify-center') + 500));
}
