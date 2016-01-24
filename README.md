# bobflux-gen
Generator for monkey files in bobflux application.
Inspired by [bobril-build](https://github.com/Bobris/bobril-build/blob/master/README.md)

## How To Generate cursors 
1. Install bobflux-gen:
  ```
  npm i bobflux-gen
  ```
2. run generation:
  ```
  node node_modules/bobflux-gen/bin/bfg c --appStatePath src/states.ts --appStateName IApplicationState
  ```
3. just look at all *.cursors.ts

## How To Generate StateBuilders for your tests
1. run generation:
  ```
  node node_modules/bobflux-gen/bin/bfg b --appStatePath src/states.ts --appStateName IApplicationState --specRelativePath ../spec/
  ```
2. just look at all *.builders.ts

