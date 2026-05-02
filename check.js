const fs = require('fs');
const files = [
  'frontend/chat.html',
  'frontend/buy.html',
  'frontend/sell.html',
  'frontend/dashboard.html',
  'frontend/index.html'
];

files.forEach(function(f) {
  try {
    const h = fs.readFileSync(f, 'utf8');
    const scriptJsCount = (h.match(/src=["']script\.js["']/g) || []).length;
    const constApiCount = (h.match(/const API\s*=/g) || []).length;
    const constUserCount = (h.match(/const user\s*=/g) || []).length;
    console.log(f);
    console.log('  script.js loads : ' + scriptJsCount);
    console.log('  const API       : ' + constApiCount);
    console.log('  const user      : ' + constUserCount);
    if (scriptJsCount > 1) console.log('  !!! DUPLICATE script.js load !!!');
    if (constApiCount > 0) console.log('  !!! const API declared in this file !!!');
  } catch(e) {
    console.log(f + ' : not found');
  }
});
