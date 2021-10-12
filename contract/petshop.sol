//SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
    function transfer(address, uint256) external returns (bool);

    function approve(address, uint256) external returns (bool);

    function transferFrom(
        address,
        address,
        uint256
    ) external returns (bool);

    function totalSupply() external view returns (uint256);

    function balanceOf(address) external view returns (uint256);

    function allowance(address, address) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

contract petShop {
    uint internal petCount;
    uint256 internal adoptionFEE;
    address internal petShopOwner;
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    constructor(uint256 _adoptionFEE) {
        petShopOwner = payable(msg.sender);
        adoptionFEE = _adoptionFEE * (10**18);
    }

    struct Pet {
        uint id;
        string petName;
        string imageURL;
        uint age;
        string breed;
        string location;
        bool adopted;
        address adopter;
    }


    // ensure function can only be called by admin
    modifier onlyOwner() {
        // function checks if the caller is admin
        // calling a function in a modifier reduces contract byte code size
        isAdmin();
         _;
    }
    
    
    // mapping pet to an ID
    mapping(uint => Pet) internal pets;
    
    // function to check if caller is an admin
    function isAdmin() internal view{
         require(msg.sender == petShopOwner, "Function can only be accessed by owner.");
    }

    // Create pet details
    function createPetDetails(
        string memory _petName,
        string memory _imageURL,
        uint _age,
        string memory _breed,
        string memory _location
    ) onlyOwner() public {
        uint _id = petCount;
        Pet storage _pet = pets[_id];
        _pet.id = _id;
        _pet.petName = _petName;
        _pet.imageURL = _imageURL;
        _pet.age = _age;
        _pet.breed = _breed;
        _pet.location = _location;
        petCount++;
    }

    // Get Pet details
    function getPetDetails(uint _id) public view returns (
        string memory,
        string memory,
        uint,
        string memory,
        string memory,
        bool,
        address
    ){
        Pet storage _pet = pets[_id];
        return (
            _pet.petName,
            _pet.imageURL,
            _pet.age,
            _pet.breed,
            _pet.location,
            _pet.adopted,
            _pet.adopter
        );
    }

    // Adopting a pet
    function adopt(uint _petID) public payable {
          Pet storage _pet = pets[_petID];
        require(_pet.adopted == false, "Pet has already been adopted");
        require(IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                address(this),
                adoptionFEE
            ),
            "Transfer failed"
        );
        _pet.adopter = msg.sender;
        _pet.adopted = true;
    }

    function getAdoptionFee() public view returns(uint256){
        return adoptionFEE;
    }

    function petShopBalance() public view returns(uint256){
        return IERC20Token(cUsdTokenAddress).balanceOf(address(this));
    }
    
    // check if caller is the owner

    function checkOwner() public view returns(bool) {
        return msg.sender == petShopOwner;
    
    }
    
    // withdraw earnings

    function withdraw(uint256 amount) onlyOwner public {
        uint256 _totalBalance = IERC20Token(cUsdTokenAddress).balanceOf(address(this));
        require(_totalBalance > 0, "Nothing to withdraw");
        require(_totalBalance >= amount, "Insuffcient Contract Balance");
        require(IERC20Token(cUsdTokenAddress).transfer(petShopOwner, amount),"Withdrawal failed");
    }

    function getPetCount() public view returns (uint) {
        return (petCount);
    }
    
    // change the data of the pet
    
    function editPet(
        uint256 _petID, 
        string memory _petName,
        string memory _imageURL,
        uint _age,
        string memory _breed,
        string memory _location) onlyOwner public {
           Pet storage _pet = pets[_petID];
           _pet.petName = _petName;
           _pet.imageURL = _imageURL;
           _pet.age = _age;
           _pet.breed = _breed;
           _pet.location = _location;
    }
    
    function transferOwnership(address _newOwner) onlyOwner public {
        petShopOwner = _newOwner;
    }
    
    function setAdoptionFee(uint256 _fee) public onlyOwner {
        adoptionFEE = _fee * (10**18);
    }

    // get address of the shop owner
    function getPetShopOwner () public view returns (address) {
        return petShopOwner;
    }
}