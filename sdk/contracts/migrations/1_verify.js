const VerifyContract = artifacts.require("Verify");

module.exports = function (deployer) {
    deployer.deploy(VerifyContract).then(function() {
        console.log(VerifyContract.address);
    });
};
