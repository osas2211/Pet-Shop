import Web3 from 'web3'
import { newKitFromWeb3 } from '@celo/contractkit'
import BigNumber from "bignumber.js"
import petShopAbi from '../contract/petshop.abi.json'
import erc20Abi from "../contract/erc20.abi.json"

const ERC20_DECIMALS = 18
// old contract address
// const PSContractAddress = "0xDAab2772fB5a04380276889e564e529e665ACe3B"

// new contract address
const PSContractAddress = "0x54aC274c44a7Fa71D5bD90454960F98a596f3768"

const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"

let pets = []
let contract
let kit
let isOwner
let adoptionFee

function notification(_text) {
  document.querySelector(".alert").style.display = "block"
  document.querySelector("#notification").textContent = _text
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none"
}

const connectCeloWallet = async function () {
  if (window.celo) {
      notification("⚠️ Please approve this DApp to use it.")
    try {
      await window.celo.enable()
      notificationOff()

      const web3 = new Web3(window.celo)
      kit = newKitFromWeb3(web3)

      const accounts = await kit.web3.eth.getAccounts()
      kit.defaultAccount = accounts[0]
      
      contract = new kit.web3.eth.Contract(petShopAbi, PSContractAddress)

    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.")
  }
}

async function approve(_price) {
  const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress)

  const result = await cUSDContract.methods
    .approve(PSContractAddress, _price)
    .send({ from: kit.defaultAccount })
  return result
}


const getBalance = async function () {
  notification("⌛ Loading...")
  isOwner = await contract.methods.checkOwner().call()
  const Fee = await contract.methods.getAdoptionFee().call()
  adoptionFee =  new BigNumber(Fee).shiftedBy(-ERC20_DECIMALS).toFixed(2)
  

  document.querySelector("#adoptionNotice").innerHTML =`<span><i class="bi bi-bell-fill"></i>  Adoption Fee is ${adoptionFee} cUSD</span> ` 
  if(isOwner){
    const petShopBalance = await contract.methods.petShopBalance().call()
    const shopBalance = new BigNumber(petShopBalance).shiftedBy(-ERC20_DECIMALS).toFixed(2)
    document.querySelector("#petShopBalance").textContent = shopBalance

  }else{
    const totalBalance = await kit.getTotalBalance(kit.defaultAccount)
    const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2)
    document.querySelector("#balance").textContent = cUSDBalance
  }
  notificationOff()
}

function UXedit() {
  //Edits UX for Users
  if(isOwner){
    $("#shopOwner").removeClass('hide')
    $("#addPet").removeClass('hide')
  }else{
    $("#normalUser").removeClass('hide')
    $("#adoptionNotice").removeClass('hide')
  }
}

// GET PETS FROM BLOCKCHAIN
const getPets = async function() {
  notification("⌛ Loading...")
  const _pets = []
  const _petCount = await contract.methods.getPetCount().call()
  for (let i = 0; i < _petCount; i++) {
    let _pet = new Promise(async (resolve, reject) => {
      let p = await contract.methods.getPetDetails(i).call()
      resolve({
        index: i,
        name: p[0],
        image: p[1],
        age: p[2],
        breed: p[3],
        location: p[4],
        adopted: p[5],
        adopter: p[6],
      })
    })
    _pets.push(_pet)
  }
  pets = await Promise.all(_pets)
  renderPets()
}

function renderPets() {
    notification("⌛ Loading...")
    document.getElementById("petGallery").innerHTML = ""
    pets.forEach((_pet) => {
      const newDiv = document.createElement("div")
      newDiv.className = "col-md-4"
      newDiv.innerHTML = petTemplate(_pet)
      document.getElementById("petGallery").appendChild(newDiv)
      editTemplate(_pet)
    })
    notificationOff()
}

function petTemplate(_pet) {
  return ` 
    <div class="card mb-6">
      <div class="panel panel-default panel-pet">
        <div class="panel-heading">
          <h3 class="panel-title">${_pet.name}</h3>
        </div>
        <div id=${_pet.index}id class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start">
        <i class="bi bi-check2-circle"></i>
        </div>
        <div class="panel-body">
          <img class="card-img-top" alt="140x140" data-src="holder.js/140x140" class="img-rounded img-center" style="width: 100%;" src="${_pet.image}" data-holder-rendered="true">
          <br/><br/>
          <strong>Breed</strong>: <span class="pet-breed">${_pet.breed}</span><br/>
          <strong>Age</strong>: <span class="pet-age">${_pet.age}</span><br/>
          <strong>Location</strong>: <span class="pet-location"><i class="bi bi-geo-alt-fill"></i> ${_pet.location}</span><br/><br/>
          <div id="adopt" class="d-grid gap-2">
            <a class="btn btn-lg btn-outline-dark AdoptBtn fs-6 p-3" id=${
              _pet.index
            }>
              ADOPT
            </a>
          </div>
        </div> 
      </div>
    </div>
  `
}

function editTemplate(_pet) {
  if(isOwner){
    $('#'+`${_pet.index}`).addClass('viewAdopterBtn');

    $('#'+`${_pet.index}`).contents().filter(function() {
      return this.nodeType == 3
    }).each(function(){
      this.textContent = this.textContent.replace('ADOPT','VIEW ADOPTER');
    });
    if(_pet.adopted){
      $('#'+`${_pet.index}`+'id').removeClass('bg-warning')

      $('#'+`${_pet.index}`+'id').addClass('bg-success')
    }
  }else{
    if (_pet.adopted) {
      $('#'+`${_pet.index}`+'id').removeClass('bg-warning')
  
      $('#'+`${_pet.index}`+'id').addClass('bg-success')
  
      $('#'+`${_pet.index}`).addClass('disabled');
  
      $('#'+`${_pet.index}`).contents().filter(function() {
        return this.nodeType == 3
      }).each(function(){
        this.textContent = this.textContent.replace('ADOPT','ADOPTED');
      });
    }
  }
}

document
.querySelector("#newPetBtn")
.addEventListener("click", async (e) => {
  const params = [
    document.getElementById("newPetName").value,
    document.getElementById("newImgUrl").value,
    document.getElementById("age").value,
    document.getElementById("newPetBreed").value,
    document.getElementById("newLocation").value,
  ]
  notification(`⌛ Adding "${params[0]}"...`)
  try {
    const result = await contract.methods
      .createPetDetails(...params)
      .send({ from: kit.defaultAccount })
  } catch (error) {
    notification(`⚠️ ${error}.`)
  }
  notification(`🎉 You successfully added "${params[0]}".`)
  getPets()
})

document
.querySelector("#withdrawBtn")
.addEventListener("click", async (e) => {
  const amount = document.getElementById("amount").value
  const withdrawalAmount = new BigNumber(amount).shiftedBy(ERC20_DECIMALS).toString()
 
  notification(`⌛ Withdrawing ${amount} cUSD from shop to your wallet`)
  try {
    const result = await contract.methods
      .withdraw(withdrawalAmount)
      .send({ from: kit.defaultAccount })
    notification(`🎉 Withdrawal Successful.`)
    getBalance()
  } catch (error) {
    notification(`⚠️ ${error}.`)

  }
})


document.querySelector("#petGallery").addEventListener("click", async (e) => {
  if (e.target.className.includes("AdoptBtn")) {
    const index = e.target.id
    if(e.target.className.includes("viewAdopterBtn")){
      showAdopterModal(index)
    }else{
      let hasApproved = true
      notification("⌛ Waiting for payment approval...")
      try {
        await approve(adoptionFee)
      } catch (error) {
        hasApproved = false
        notification(`⚠️ ${error}.`)
      }
      if(hasApproved){
        notification(`⌛ Awaiting payment for "${pets[index].name}"...`)
        try {
          const result = await contract.methods
            .adopt(index)
            .send({ from: kit.defaultAccount })
          notification(`🎉 You successfully adopted "${pets[index].name}".`)
          getPets()
          getBalance()
        } catch (error) {
          notification(`⚠️ ${error}.`)
        }
      }else{
        notification("⚠️ Please approve transaction to complete payment")
      }
      
    }
  }
})

function showAdopterModal(_index) {
  notification("⌛ Loading...")
  document.getElementById("adopterModal").innerHTML = ""
  const newDiv = document.createElement("div")
  newDiv.className = "modal-content"
  newDiv.innerHTML = adopterModalTemplate(pets[_index])
  document.getElementById("adopterModal").appendChild(newDiv)
  $("#viewAdopterModal").modal('show');
  notificationOff()
}

function adopterModalTemplate(_pet){
  return`
  <div class="modal-content">
  <div class="modal-content" id="adopter-modal">
    <div class="modal-header">
      <i class="bi bi-person"></i>
      <button type="button" class="btn-close closeModal" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body" >
      <div class="card mb-4">
        <div class="card-body p-4 position-relative">
          <div class="translate-middle-y" id="identicon">
            ${identiconTemplate(_pet.adopter)}
          </div>
          <span>${_pet.adopter}</span>
      </div>
    </div>
  </div>
  `
}

function identiconTemplate(_address) {
  const icon = blockies
    .create({
      seed: _address,
      size: 8,
      scale: 16,
    })
    .toDataURL()

  return `
    <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
      <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
          target="_blank">
          <img src="${icon}" width="48" alt="${_address}">
      </a>
    </div>
    `
}


window.addEventListener('load', async () => {
  notification("⌛ Loading...")
  await connectCeloWallet()
  await getBalance()
  UXedit()
  await getPets()
  notificationOff()
});

