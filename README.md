jibe
====

[![npm version badge](https://img.shields.io/npm/v/jibe-sync.svg)](https://www.npmjs.org/package/jibe-sync)
[![downloads badge](http://img.shields.io/npm/dm/jibe-sync.svg)](https://www.npmjs.org/package/jibe-sync)

jibe watches the specified project files and uploads changes over SSH whenever
a file is saved (or a file is added). Jibe also obeys .gitignore files, so that
only files that should be included in your repository will be synced.

## Why use jibe?

jibe allows you to work on a git project from the comfort of your favorite
computer (and editor) while running and testing on another machine. This is
especially useful for projects with hardware requirements or environments that
are not easily reproducable on your dev machine. It does, however, require that
the remote machine have an SSH server.

Writing a GPIO program for the Raspberry Pi, for example, would be a great use
case for jibe.

## Installation

`npm install jibe-sync -g`

## Using jibe

`jibe srcDir user@host:path`

jibe's command line parameters work kind of like scp, but with a twist.
If `path` ends in a forward slash, a new directory is created on the remote
server with the same name as `srcDir`, otherwise it will be synced directly
to the directory specified by `path`.

## Example usage

Let's say your were inside of a directory named `example`, and it happened to
also be the root directory of a git repository. Running the following command:
`jibe . user@server:~/` would create a directory named `example` in user's home
directory on server and sync the project there. If I wanted to rename the
project directory on server I would instead run the command
`jibe . user@server:~/exampleRenamed`
