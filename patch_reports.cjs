const fs = require('fs');
let content = fs.readFileSync('src/components/ReportsTab.tsx', 'utf8');

// Add imports
const importTarget = `import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';`;
const newImports = `import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import domtoimage from 'dom-to-image-more';
import React, { useRef, useState } from 'react';`;

content = content.replace(importTarget, newImports);
content = content.replace(`export default function ReportsTab() {`, `export default function ReportsTab() {\n  const reportRef = useRef<HTMLDivElement>(null);\n  const [isExporting, setIsExporting] = useState(false);\n\n  const handleExport = async () => {\n    if (!reportRef.current) return;\n    setIsExporting(true);\n    try {\n      const scale = 2;\n      const dataUrl = await domtoimage.toPng(reportRef.current, {\n        quality: 1,\n        height: reportRef.current.offsetHeight * scale,\n        width: reportRef.current.offsetWidth * scale,\n        style: {\n          transform: \`scale(\${scale})\`,\n          transformOrigin: 'top left',\n          width: \`\${reportRef.current.offsetWidth}px\`,\n          height: \`\${reportRef.current.offsetHeight}px\`\n        }\n      });\n      const pdf = new jsPDF({\n        orientation: 'landscape',\n        unit: 'px',\n        format: [reportRef.current.offsetWidth, reportRef.current.offsetHeight]\n      });\n      pdf.addImage(dataUrl, 'PNG', 0, 0, reportRef.current.offsetWidth, reportRef.current.offsetHeight);\n      pdf.save('reports.pdf');\n    } catch (err) {\n      console.error('Export failed', err);\n    } finally {\n      setIsExporting(false);\n    }\n  };`);

content = content.replace(`        <button className="px-6 py-3 bg-neu-base shadow-neu-extruded hover:shadow-neu-extruded-hover active:shadow-neu-inset rounded-full font-bold text-sm text-neu-primary flex items-center gap-2 transition-all">`, `        <button onClick={handleExport} disabled={isExporting} className="px-6 py-3 bg-neu-base shadow-neu-extruded hover:shadow-neu-extruded-hover active:shadow-neu-inset rounded-full font-bold text-sm text-neu-primary flex items-center gap-2 transition-all disabled:opacity-50">`);

content = content.replace(`{isExporting ? 'Exporting...' : 'Export All Reports'}`); // just in case I want to change text
content = content.replace(`Export All Reports`, `{isExporting ? 'Exporting...' : 'Export All Reports'}`);

content = content.replace(`      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">`, `      <div ref={reportRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-neu-base p-4 rounded-3xl">`);

fs.writeFileSync('src/components/ReportsTab.tsx', content);
console.log('Successfully updated ReportsTab.');

