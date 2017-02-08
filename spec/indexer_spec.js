var chai = require('chai');
var spies = require('chai-spies');
chai.use(spies);
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;

var Indexer = require('../src/indexer');

describe('Indexer', function() {

    var proven;
    var ipfsLink;
    var metadataGatherer;
    var repository;
    var indexer;
    var mockDeposition = {ipfsHash: 'abcd'};
    var mockManifest = {FileName: 'filename'};
    var mockPayload = 'this is the payload';
    var mockMetadata = {filename: 'abcd', importantTag: 'efg'};

    beforeEach(function() {
        proven = {
            onDepositionPublished: (callback) => {callback(null, mockDeposition);}
        };
        ipfsLink = {
            pinEnclosure: (ipfsHash) => {return Promise.resolve();},
            readManifest: (ipfsHash) => {return Promise.resolve(mockManifest);},
            getPayload: (ipfsHash, filename) => {return Promise.resolve('/path/to/payload');}
        };
        metadataGatherer = {
            aggregate: (deposition, manifest, payload) => {return Promise.resolve(mockMetadata);}
        };
        repository = {
            store: (metadata) => {}
        };
        indexer = new Indexer(proven, ipfsLink, metadataGatherer, repository, {log: () => {}});
    });

    it('hooks the onDepositionPublished event on the contract', function(done) {
        chai.spy.on(proven, 'onDepositionPublished');
        indexer.runOnce().then(function() {
            expect(proven.onDepositionPublished).to.have.been.called();
            done();
        }).catch(function(error) {
            done(error);
        });
    });

    it('pins the enclosure', function(done) {
        chai.spy.on(ipfsLink, 'pinEnclosure');
        indexer.runOnce().then(function() {
            expect(ipfsLink.pinEnclosure).to.have.been.called.with(mockDeposition.ipfsHash);
            done();
        }).catch(function(error) {
            done(error);
        });
    });

    it('loads the manifest', function(done) {
        chai.spy.on(ipfsLink, 'readManifest');
        indexer.runOnce().then(function() {
            expect(ipfsLink.readManifest).to.have.been.called.with(mockDeposition.ipfsHash);
            done();
        }).catch(function(error) {
            done(error);
        });
    });

    it('loads the payload', function(done) {
        chai.spy.on(ipfsLink, 'getPayload');
        indexer.runOnce().then(function() {
            expect(ipfsLink.getPayload).to.have.been.called.with(mockDeposition.ipfsHash, 'content/' + mockManifest.FileName);
            done();
        }).catch(function(error) {
            done(error);
        });
    });

    it('gathers metadata', function(done) {
        chai.spy.on(metadataGatherer, 'aggregate');
        indexer.runOnce().then(function() {
            expect(metadataGatherer.aggregate).to.have.been.called.with(mockDeposition, mockManifest, '/path/to/payload');
            done();
        }).catch(function(error) {
            done(error);
        });
    });

    it('stores the metadata into the repository', function(done) {
        chai.spy.on(repository, 'store');
        indexer.runOnce().then(function() {
            expect(repository.store).to.have.been.called.with(mockMetadata);
            done();
        }).catch(function(error) {
            done(error);
        });
    });

    describe('on error', function() {

        it('rejects if there was an error pinning the enclosure', function() {
            ipfsLink.pinEnclosure = () => {return Promise.reject('Error pinning enclosure');}
            expect(indexer.runOnce()).to.be.rejectedWith('Error pinning enclosure');
        });

        it('rejects if there was an error loading the manifest', function() {
            ipfsLink.readManifest = () => {return Promise.reject('Error reading manifest');}
            expect(indexer.runOnce()).to.be.rejectedWith('Error reading manifest');
        });

        it('rejects if there was an error loading the payload', function() {
            ipfsLink.getPayload = () => {return Promise.reject('Error determining payload path');}
            expect(indexer.runOnce()).to.be.rejectedWith('Error determining payload path');
        });

        it('rejects if there was an error gathering metadata', function() {
            metadataGatherer.aggregate = () => {return Promise.reject('Error gathering metadata');}
            expect(indexer.runOnce()).to.be.rejectedWith('Error gathering metadata');
        });

        it('rejects if there was an error storing metadata', function() {
            repository.store = () => {return Promise.reject('Error storing metadata');}
            expect(indexer.runOnce()).to.be.rejectedWith('Error storing metadata');
        });
    });
});
