
const child_process = require('child_process');
const process = require('process');
const fs = require('fs');
const fsPath = require('path');

async function rmDir(removePath) {

  if (!fs.existsSync(removePath)) {
    return;
  } else if (fs.statSync(removePath).isDirectory()) {
    let dirList = fs.readdirSync(removePath);
    for (item of dirList) {
      const subPath = fsPath.join(removePath, item);
      rmDir(subPath);
    }
    fs.rmdirSync(removePath);
  } else {
    fs.unlinkSync(removePath);
  }
}


async function run() {
  const basePath = process.cwd();
  const distPath = fsPath.join(basePath, 'dist');
  console.log(distPath);

  rmDir(distPath);

  const ngProcess = child_process.spawn(`ng`, [`build`, `json-giant`], { shell: true });
  ngProcess.stderr.on('data',
    data => {
      console.log(data.toString());
      process.exit(4);
    }
  );
  ngProcess.stdout.on('data',
    data => {
      console.log(data.toString());
    }
  );

  ngProcess.on('exit', code => {
    if (code !== 0) {
      console.log(`ng build failed with code ${code}`);
    }
  })

  const watcher = fs.watch(basePath);
  watcher.on('change', function () {
    if (fs.existsSync(distPath)) {
      watcher.close();
      const processElectron = child_process.spawn(fsPath.join('.', 'node_modules', '.bin', 'electron'), [`"${basePath}"`, 'debug-mode'], { shell: true });
      processElectron.stdout.on('data', data => {
        console.log(data.toString());
      });
      processElectron.stderr.on('data', data => {
        console.log(data.toString());
      });
      processElectron.on('exit', code => {
        if (code !== 0) {
          console.log(`Electron failed with code ${code}`);
          process.exit(2);
        } else {
          process.exit(0);
        }
      });
    }
  });
}

run();
