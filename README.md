# Redis FireSync
Synchronise data between Firebase and REDIS. 

** Currently only support manual run. Future updates will add change detection, allowing it to be hosted on a server.

# Environment Variables
>GOOGLE_APPLICATION_CREDENTIALS

File path to the API key json file downloaded from Firebase project settings.

>PROJECT_ID

Project ID found in Firebase project settings.

# Quick Start

Run installation of node modules.

`npm install`

Build project with Typescript. Output is in ./dist folder.

`npm build`

Create a file named .env in the root directory and fill in the environment variables. Run the tool.

`node ./dist/index.js --database -s product:name,category,article`

# Usage
`node ./dist/index.js [COMMAND] [ARGS...]`

The `--database` command converts FireStore data into key value pair dictionary which is stored as a REDIS database.

`--clear` command would clear the REDIS database.

# Arguments
<table>
    <thead>
        <tr>
            <th>Name, shorthand</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>
                <code>--sync, -s</code>
            </td>
            <td>
                Specifies the collection names to be converted separated by <b>","</b>. A basic index between a field and the document ID needs to be setup, append the field name with <b>":"</b> after the collection name. Required.
            </td>
        </tr>
    </tbody>
</table>