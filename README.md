# dorgular

## getting started

pull down the repo and run `npm install` at the root

run `bower install` at the root (if you haven't got bower installed run `npm install -g bower' first)

if it's not already installed, get [homebrew](http://brew.sh/)

if it's not already installed, get mongodb by running `brew install mongodb`

at the end of this install process, brew will provide some additional commands to keep mongo running all the time, and autotart when you boot up (see below). run these.

`ln -sfv /usr/local/opt/mongodb/*.plist ~/Library/LaunchAgents`

`launchctl load ~/Library/LaunchAgents/homebrew.mxcl.mongodb.plist`

then run `brew tap gapple/services`

then check that mongodb is in your services by running
`brew services list | grep mongodb`

it should look like this:
`mongodb    started      826 /Users/jwhitmarsh/Library/LaunchAgents/homebrew.mxcl.mongodb.plist`

now run these commands (in this order)

`grunt build` (takes a while)

`cd dist`

`npm install` (takes a long while)

`npm run start-dist`

navigate to [dora](http://localhost:33000)




