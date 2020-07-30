const UrlHash = require("./url-hash");
function diffUrlHashes(hashStore,hashes) {
    console.log(`diffUrlHashes ${JSON.stringify(hashes)}`);
    onlyDefined = (arr) => arr.filter(x=>x);
    return Promise.all( 
        hashes.map( hash => hashStore.getLatestHash(hash) )
    ).then( oldHashes => UrlHash.findChangedHashes( hashes, onlyDefined(oldHashes) ) )
     .then( changedHashes => hashStore.writeHashes(changedHashes) );
}
module.exports = diffUrlHashes;