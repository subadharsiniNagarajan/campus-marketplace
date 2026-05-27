var fs=require('fs');
var c=fs.readFileSync('frontend/purchase.html','utf8');
var orig=c.length;
// Step 1: wrap existing buttons in a div, add success state after
var oldA='          <!-- Buttons -->';
var newA='          <!-- Buttons -->\n          <div id="purchase-form-actions">';
c=c.replace(oldA,newA);
// Close the wrapper div and add success state before the form card closing div
var oldB='          <!-- No payment notice -->\n          <div class="purchase-notice">\n            &#128274; No payment required â this is a campus coordination request only.\n          </div>';
console.log('oldB found:',c.includes(oldB));
