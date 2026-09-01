const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const searchBarTarget = `<div className="flex flex-1 sm:flex-none justify-end items-center ml-auto">
               <div className="relative flex items-center w-full max-w-[280px] sm:w-64">
                 <div className="w-full h-12 rounded-full shadow-neu-inset bg-neu-base px-5 flex items-center focus-within:ring-2 focus-within:ring-neu-accent focus-within:ring-offset-2 focus-within:ring-offset-neu-base transition-all">
                   <Search className="w-4 h-4 text-neu-muted mr-3 shrink-0" />
                   <input 
                      className="bg-transparent border-none outline-none w-full text-sm font-bold text-neu-primary placeholder:text-neu-muted focus:ring-0 min-w-0"
                      placeholder="Search..."
                      aria-label="Global search"
                      type="text"
                      value={globalSearch}
                      onChange={(e) => setGlobalSearch(e.target.value)}
                   />
                 </div>
               </div>
            </div>`;

const searchBarReplacement = `{activeTab === 'transactions' && (
              <div className="flex flex-1 sm:flex-none justify-end items-center ml-auto">
                 <div className="relative flex items-center w-full max-w-[280px] sm:w-64">
                   <div className="w-full h-12 rounded-full shadow-neu-inset bg-neu-base px-5 flex items-center focus-within:ring-2 focus-within:ring-neu-accent focus-within:ring-offset-2 focus-within:ring-offset-neu-base transition-all">
                     <Search className="w-4 h-4 text-neu-muted mr-3 shrink-0" />
                     <input 
                        className="bg-transparent border-none outline-none w-full text-sm font-bold text-neu-primary placeholder:text-neu-muted focus:ring-0 min-w-0"
                        placeholder="Search..."
                        aria-label="Global search"
                        type="text"
                        value={globalSearch}
                        onChange={(e) => setGlobalSearch(e.target.value)}
                     />
                   </div>
                 </div>
              </div>
            )}`;

content = content.replace(searchBarTarget, searchBarReplacement);
fs.writeFileSync('src/App.tsx', content);
console.log('Updated search bar visibility');
