const fetch = require("node-fetch");
const UrlHash = require("./url-hash");
function retrieveUrlHash( url ) {
    console.info(`Retrieving ${url}...`)
    return fetch( url, { 
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36"
        }
    } )
        .then( response => response.text() )
        .then( content => new UrlHash( url, content, Date.now() ));
}
module.exports = retrieveUrlHash;