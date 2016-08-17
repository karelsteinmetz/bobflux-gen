# bobflux-gen
Generator for monkey files in bobflux application.
Inspired by [bobril-build](https://github.com/Bobris/bobril-build/blob/master/README.md)

## How To Generate cursors 
1. Install bobflux-gen:
  ```
  npm i bobflux-gen -g
  ```
2. run generating:
  ```
  bfg c --appStatePath src/states.ts --appStateName YourRootStateName --parentStateKey prefix.of.your.state.in.global.state --recursively 1
    
  ```
  * "-p, --appStatePath <appStatePath>" - defines pattren for state files search (default is ./state.ts)
  * "-n, --appStateName <appStateName>" - defines root name of Application state (default is IApplicationState)
  * "-k, --parentStateKey <parentStateKey>" - defines key of parent state, it's suitable for nested states (default is empty)
  * "-r, --recursively <1/0>" - enables recursively generation for nested states (default is 0)
  * "-d, --debug <1/0>", "enables logging in debug level", /^(true|false|1|0|t|f|y|n)$/i, "0"

3. just look at all *.cursors.ts

## How To Generate functionl cursors 
1. Install bobflux-gen:
  ```
  npm i bobflux-gen -g
  ```
2. run generation:
  ```
  bfg fc --appStatePath src/states.ts --appStateName YourRootStateName --parentStateKey prefix.of.your.state.in.global.state --recursively 1
    
  ```
  * "-p, --appStatePath <appStatePath>" - defines pattren for state files search (default is ./state.ts)
  * "-n, --appStateName <appStateName>" - defines root name of Application state (default is IApplicationState)
  * "-k, --parentStateKey <parentStateKey>" - defines key of parent state, it's suitable for nested states (default is empty)
  * "-r, --recursively <1/0>" - enables recursively generation for nested states (default is 0)

3. just look at all *.f.cursors.ts

## How To Generate StateBuilders for your tests
1. Install bobflux-gen:
  ```
  npm i bobflux-gen -g
  ```
2. run generating:
  ```
  bfg b --appStatePath src/states.ts --appStateName YourRootStateName --specRelativePath ../spec/ --recursively 1
  ```
  * "-p, --appStatePath <appStatePath>" - defines pattren for state files search (default is ./state.ts)
  * "-n, --appStateName <appStateName>" - defines root name of Application state (default is IApplicationState)
  * "-s, --specRelativePath <specRelativePath>" - defines spec directory relative path from appStatePath (default is next to states)
  * "-k, --parentStateKey <parentStateKey>" - defines key of parent state, it's suitable for nested states (default is empty)
  * "-r, --recursively <1/0>" - enables recursively generation for nested states (default is 0)
  * "-d, --debug <1/0>", "enables logging in debug level", /^(true|false|1|0|t|f|y|n)$/i, "0"

3. just look at all *.builders.ts

## How To Generate OData Api
1. Install bobflux-gen:
  ```
  npm i bobflux-gen -g
  ```
2. run generating:
  ```
  bfg o -u http://localhost:8097/api/odata/$metadata -f ./axiosApi.ts
  ```
  * "-u, --metadataUlr <metadataUlr>", "defines odata metadata url
  * "-f, --targetFile <targetFile>", "defines target file where will be odata api generated
  * "-d, --debug <1/0>", "enables logging in debug level", /^(true|false|1|0|t|f|y|n)$/i, "0"

3. just look into ./axiosApi.ts

