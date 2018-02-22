const packager = require('electron-packager')
const process = require('process');
const { spawn } = require('child_process');
const packageInfo = require('../package.json');

const PLAT_OSX = 'darwin';
const PLAT_WINDOWS = 'win32';

build();


async function build() {
  const platforms = [
    // PLAT_OSX//,
    PLAT_WINDOWS
  ]

  // build app
  const buildProcess = spawn('ng', ['build', '--base-href', '', '--aot','--sourcemaps', '--prod'], {shell: true});

  buildProcess.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  buildProcess.stderr.on('data', (data) => {
    console.log(data.toString());
  });

  buildProcess.on('close', async function (code) {
    if (code === 0) {
      // package for all platforms
      for (let platform of platforms) {
        let files = await buildPlatform(platform);
        for (let file of files) {
          if (platform === PLAT_OSX) {
            makeDMG(file);
          }
          console.log(`Created application package ${file} for platform ${platform}`);
        }
      }
    } else {
      console.log('Build failed');
    }
  });

  //buildProcess.on('data')

}

function skipFile(filename) {
  const excluded = [
    '/AppIcon.svg',
    '/build-app.js',
    '/output',
    '/karma.conf.js',
    '/package-lock.json',
    '/protractor.conf.js',
    '/README.md',
    '/start-build',
    '/start-debug',
    '/tslint.json',
    '/tsconfig.json'
  ]

  const excludedFolder = [
    '/etc',
    '/e2e',
    '/utils'
  ]

  if (excludedFolder.findIndex(folder => filename.startsWith(folder)) >= 0 || excluded.indexOf(filename) !== -1) {
    return true;
  } else {
    return false;
  }
}

function getBuildOptions(platform) {

  let options = {
    dir: ".",
    platform: platform,
    out: "output",
    overwrite: true,
    ignore: skipFile,
    arch: 'all',
    osxSign: false,
    prune: true//,
    // asar: true,
    // derefSymlinks: true
  }

  switch (platform){
    case PLAT_OSX:
      options.icon = 'AppIcon.icns';
      options.appBundleId = "com.broken-d.json-giant";
      options.appCategoryType = 'public.app-category.developer-tools';
      options.appCopyright = "Copyright 2016 De Wildt van Reenen";
      break;
    case PLAT_WINDOWS:
      options.icon = 'AppIcon.ico';
      options.
      break;
  }

  return options;
}


function makeDMG(path) {
  const DMG_PATH = `output/${packageInfo.productName}.dmg`;

  console.log(`Creating DMG from folder ${path}...`);
  const dmgProcess = spawn('hdiutil', [
        'create',
        '-fs',
        'HFS+',
        '-ov',       // overwrite
        '-format',
        'UDZO',      // zlib compress
        '-srcfolder',
        path,
        '-volname',
        packageInfo.productName,
        DMG_PATH
    ]);
  dmgProcess.on('close', function(code){
    if (code === 0) {
      console.log(`  DMG "${DMG_PATH}" created`);
    } else {
      console.log(`  DMG creationg failed with code ${code}`);
    }
  })
}

async function buildPlatform(selectedPlatform) {
  const buildOptions = getBuildOptions(selectedPlatform);
  let prom = new Promise(function(resolve, reject){
    packager(buildOptions, function done_callback (err, appPaths) {
      if (err) {
        reject(err);
      } else {
        resolve(appPaths);
      }
    })
  });
  return prom;
}


