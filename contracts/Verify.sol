/**

    Domain : 0x0000000000000000000000000000000000000000000000000000000000000020

    1. Message: 0x321580d53f250a51ed527f5f7856bdd2ecbbf19f722ee6acc1804f63462375f3
    2. Signature:[3789870118542016974105699138161781008918636358438246688710078193373583696417, 20766815278548398344257910495536643911108480586016736348038320126600861929561]
    3. PublicKey:[1877680754511875309899085821046020641041516699522550968201931210511122361188, 1879687745237862349771417085220368195630510774060410176566704734657946401647, 10177664824327229270631241062558466194853353905576267792570130720130119743401, 2617838070911723228053200997531205923494421078683439118196637157934995837361] 

*/
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./BLS.sol";

contract Verify {

    bytes32 domain;        

    constructor(bytes32 _domain) {
        domain = _domain;
    }

    function verify(bytes memory _message, uint256[2] calldata _signature, uint256[4] memory _publicKey) public view returns (bool) {
        bool callSuccess;
        bool checkSuccess;
        (checkSuccess, callSuccess) = BLS.verifySingle(_signature, _publicKey, BLS.hashToPoint(domain, _message));

        require(callSuccess, "Incorrect Publickey or Signature Points");
        require(checkSuccess, "Incorrect Input Message");

        return true;
    }


}



