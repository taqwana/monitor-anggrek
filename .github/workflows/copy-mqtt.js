// Menyalin library (MQTT dan three.js) ke folder www supaya aplikasi jalan tanpa CDN
const fs = require('fs'), path = require('path');
const cp = (a, b) => { fs.mkdirSync(path.dirname(b), { recursive: true }); fs.copyFileSync(a, b); };
cp('node_modules/mqtt/dist/mqtt.min.js', 'www/mqtt.min.js');
cp('node_modules/three/build/three.module.js', 'www/lib/three.module.js');
cp('node_modules/three/examples/jsm/controls/OrbitControls.js', 'www/lib/addons/controls/OrbitControls.js');
console.log('library disalin ke www/');
