const crypto = require("crypto");

function UrlHash( ) {
    function hash( content ) {
        const hash = crypto.createHash('md5');
        return hash.update(content).digest().toString('hex');
    }
    // If a single argument is passed assume this is a copy constructor
    if ( arguments.length === 1) {
        const obj = arguments[0];
        this.url = obj.url;
        this.content = obj.content;
        this.hash = obj.hash;
        this.timestamp = obj.timestamp;
    } else {
        // construct a hash from the passed url, content and timestamp
        let [url, content, timestamp ] = arguments;
        this.url = url;
        this.content = content;
        this.hash = hash(content);
        this.timestamp = timestamp;
    }
}
UrlHash.prototype.toJSON = function() {
    return {
        url: this.url,
        hash: this.hash,
        content: this.content,
        timestamp: this.timestamp
    }
}
UrlHash.prototype.hasChanged = function(hash) {
    return (hash.url === this.url) && (hash.hash != this.hash);
}

UrlHash.findChangedHashes = function(newHashes, oldHashes) {
    const changed = [];
    newHashes.forEach( a => {
        // hasChanged returns true iff the url exists and
        // the hashes are different.
        let hash = oldHashes.find( b => a.hasChanged(b) );
        if ( hash ) {
            changed.push(a);
        } else {
            // if the hash doesn't exist then we need to
            // still add it to the change set.
            hash = oldHashes.find( b => a.url === b.url );
            if ( hash === undefined ) 
                changed.push(a);
        }
    });
    return changed;
}
module.exports = UrlHash;