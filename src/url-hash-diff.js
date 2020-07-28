const UrlHash = require("./url-hash");
function diffUrlHashes(hashStore,hashes) {
    return Promise.all( 
        hashes.map( hash => hashStore.getLatestHash(hash) )
    ).then( oldHashes => UrlHash.findChangedHashes( hashes, oldHashes ) )
     .then( changedHashes => hashStore.writeHashes(changedHashes) );
}
module.exports = diffUrlHashes;