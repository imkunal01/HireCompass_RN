const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walkDir(filePath);
        } else if (filePath.endsWith('.ts')) {
            let content = fs.readFileSync(filePath, 'utf8');
            let newContent = content.replace(/new ObjectId\(req\.params\.id\)/g, 'new ObjectId(req.params.id as string)');
            if (newContent !== content) {
                fs.writeFileSync(filePath, newContent, 'utf8');
                console.log('Updated ' + filePath);
            }
            if (filePath.endsWith('debug.routes.ts')) {
                let debugContent = fs.readFileSync(filePath, 'utf8');
                debugContent = debugContent.replace('import pdfParse from "pdf-parse";', 'const pdfParse = require("pdf-parse");');
                fs.writeFileSync(filePath, debugContent, 'utf8');
            }
        }
    }
}

walkDir('./src');
