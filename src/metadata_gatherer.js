const exec = require('child_process').exec;

var MetadataGatherer = function() {
};

const depositionFieldMap = {
    ipfsHash: "ipfsHash",
    depositionId: "deposition",
    deponent: "deponent"
};

var initializeMetadataFromDeposition = function(deposition) {
    return {
        ipfsHash: deposition.ipfsHash,
        depositionId: deposition.deposition,
        deponent: deposition.deponent
    };
};

var addMetadataFromManifest = function(metadata, manifest) {
    metadata.filename = manifest.FileName;
    metadata.guid = manifest.GUID;
    metadata.blockchains = {
        ethereum: {
            "blockHash": manifest.EthereumBlockHash,
            "blockNumber": manifest.EthereumBlockNumber
        },
        bitcoin: {
            "blockHash": manifest.BitcoinBlockHash,
            "blockNumber": manifest.BitcoinBlockNumber
        }
    };
    metadata.fileHashes = {
        sha1: manifest.FileHashes
    };
    metadata.previousFileHashes = manifest.PreviousFileHashes;
    metadata.previousIpfsHash = manifest.PreviousIPFSHash;
};

var addMetadataFromExifTags = function(metadata, exifTags) {
    metadata.exiftool = exifTags;
    metadata.createdAt = exifTags.DateTimeOriginal;
    metadata.cameraModel = exifTags.Model;
    metadata.imageWidth = exifTags.ImageWidth;
    metadata.imageHeight = exifTags.ImageHeight;
};

MetadataGatherer.prototype.aggregate = function(deposition, manifest, payloadPath) {
    return new Promise(function(resolve, reject) {
        var metadata = initializeMetadataFromDeposition(deposition);
        addMetadataFromManifest(metadata, manifest);

        exec('exiftool -json ' + payloadPath, function(error, stdout, stderr) {
            if (error) {
                reject(error);
            } else {
                var json = JSON.parse(stdout)[0];
                addMetadataFromExifTags(metadata, json);
                resolve(metadata);
            }
        });
    });
};

module.exports = MetadataGatherer;
