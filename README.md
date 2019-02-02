# JsonGiant

Json Giant is a json viewer intended to view large json files locally without the need to upload them to a web server. Asside from the time
taken to keep uploading large files to online viewers the data might be sensistive and you wouldn't want to upload it just to view it.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.6.1.

## Start Json Giant for debugging

To start Json Giant for debugging run `yarn start`. This will build (and watch for changes) Json Giant and launch electron in debug
mode. This currently will not work on windows.

## Running unit tests

Run `yarn test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Building an Application Package

To build a Json Giant application package for all platforms run `yarn build`, this will build the packages for windows, osx and linux and place them in the ```output``` directory. To build only one platform you can use:
* `yarn build windows`
* `yarn build linux`
* `yarn build osx`

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
