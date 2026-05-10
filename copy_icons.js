const fs = require('fs');
const path = require('path');

const src = "C:\\Users\\eugene\\.gemini\\antigravity\\brain\\ed8440f0-67ea-41e4-96a1-f4ed1b67d7a1\\todo_app_icon_1772380343600.png";
const destDir = "C:\\Users\\eugene\\Projects\\Work01_Anti\\public";

const targets = ['logo192.png', 'logo512.png', 'favicon.ico'];

targets.forEach(target => {
    const dest = path.join(destDir, target);
    try {
        fs.copyFileSync(src, dest);
        console.log(`Successfully copied ${src} to ${dest}`);
    } catch (err) {
        console.error(`Error copying to ${dest}:`, err);
    }
});
