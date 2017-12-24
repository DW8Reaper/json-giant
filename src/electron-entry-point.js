/**
 * Created by dewildt on 2/7/17.
 */

const _ = require('lodash');

const {app, BrowserWindow, Menu, globalShortcut} = require('electron');
const path = require('path');
const url = require('url');

let jsonWindows = [];

function appLoaded() {
    globalShortcut.register('Esc', () => {
        'use strict';
        let focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
            //console.log("finding 1 " + focusedWindow.webContents);
            focusedWindow.webContents.send('do-escape');
        }
    });



    const template = [
        {
          label: "File",
            submenu: [
                {
                  label: "New Window",
                    accelerator: 'CmdOrCtrl+N',
                    click : onNewWindow
                }
           ]
        },
        {
            label: 'Edit',
            submenu: [
                {
                    role: "reload"
                },
                {
                    role: "cut"
                },
                {
                    role: "copy"
                },
                {
                    role: "paste"
                },
                {
                    role: "separator"
                },
                {
                    label: "Find",
                    accelerator: "CmdOrCtrl+F",
                    click: onFind
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label:"Show Dev Tools",
                    role: 'toggledevtools'
                },
                {
                    label: "Reload",
                    role: 'reload'
                },
                {
                    label: "Force Reload",
                    role: 'forcereload'
                }
            ]
        },
        {
            role: 'window',
            submenu: [
                {
                    role: 'minimize'
                },
                {
                    role: 'close'
                }
            ]
        },
        {
            role: 'help',
            submenu: [
                {
                    label: 'Learn More',
                    click () { require('electron').shell.openExternal('http://electron.atom.io') }
                }
            ]
        }
    ];

    if (process.platform === 'darwin') {
        template.unshift({
            label: app.getName(),
            submenu: [
                {
                    role: 'about'
                },
                {
                    type: 'separator'
                },
                {
                    role: 'services',
                    submenu: []
                },
                {
                    type: 'separator'
                },
                {
                    role: 'hide'
                },
                {
                    role: 'hideothers'
                },
                {
                    role: 'unhide'
                },
                {
                    type: 'separator'
                },
                {
                    role: 'quit'
                }
            ]
        });
        
        // Window menu.
        template[3].submenu = [
            {
                label: 'Close',
                accelerator: 'CmdOrCtrl+W',
                role: 'close'
            },
            {
                label: 'Minimize',
                accelerator: 'CmdOrCtrl+M',
                role: 'minimize'
            },
            {
                label: 'Zoom',
                role: 'zoom'
            },
            {
                type: 'separator'
            },
            {
                label: 'Bring All to Front',
                role: 'front'
            }
        ]
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);


    createWindow();
}

function createWindow() {
    let newWindow = new BrowserWindow({
        width: 1060,
        height: 850,
        // webPreferences: {
        //
        // }
    });

    newWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));

    jsonWindows.push(newWindow);

    if (_.indexOf(process.argv, 'debug-mode') >= 0) {
        newWindow.webContents.openDevTools();
    }

    newWindow.on('closed', () => {
        jsonWindows.splice(_.indexOf(newWindow), 1);
    });
}


app.on('ready', appLoaded);

app.on('window-all-closed', () => {
   if(process.platform !== 'darwin') {
       app.quit();
   };
});

app.on('activate', () => {
   if (jsonWindows.length === 0) {
       createWindow();
    }
});

function onFind() {
    'use strict';
    //console.log("finding");
    let focusedWindow = BrowserWindow.getFocusedWindow();
    //console.log("finding 1 " + focusedWindow.webContents);
    focusedWindow.webContents.send('do-find');

//    focusedWindow.webContents.findInPage("ap");


    //console.log("finding 2");

}

function onNewWindow(){
    "use strict";

    createWindow();

}
