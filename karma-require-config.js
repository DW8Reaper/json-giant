/**
 * Created by dewildt on 2/18/17.
 */

// copy top window variables to the frame the tests execute in
window.require = window.top.require;
window.process = window.top.process;
window.__dirname = window.top.__dirname;

//
// {
//     let newPaths = [];
//
//     require('module').globalPaths.forEach(function (path) {
//         'use strict';
//         if (path.indexOf('electron.asar') >= 0) {
//             newPaths.push(path.replace(/electron\.asar.*$/, 'electron.asar/base/node_modules'));
//         }
//     });
//
//     newPaths.forEach(function(path) {
//         'use strict';
//         require('module').globalPaths.push(path);
//     })
//
// }



    require('module').globalPaths.push('node_modules');
    require('module').globalPaths.push('/node_modules');
    require('module').globalPaths.push('./node_modules');

window.jQuery = require('jquery');
window.init_for_testing = true;



