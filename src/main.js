import Web3 from 'web3'
import { newKitFromWeb3 } from '@celo/contractkit'
import BigNumber from "bignumber.js"
import petShopAbi from '../contract/petshop.abi.json'
import erc20Abi from "../contract/erc20.abi.json"

const ERC20_DECIMALS = 18
const PSContractAddress = "0xDAab2772fB5a04380276889e564e529e665ACe3B"
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
  adoptionFee = new BigNumber(Fee)
  
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

// LOADING DUMMY PETS 
// Uncomment this and the Add Details Button in the html file after re-deploying the contract on the blockchain. It helps populate the data for the shop
// const DummyPets = [
//   {
//     "id": 0, 
//     "name": "Frieda", 
//     "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQVnR4AjQolV1cLAoefQ0Er9JSZ0vYfEzRgdw&usqp=CAU",
//     "age": "3", 
//     "breed": "Scottish Terrier", 
//     "location": "Lisco, Alabama"
//   },
//   {
//     "id": 1, 
//     "name": "Gina",
//     "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS_wwtK06DE17BxvvJVlz99DnDl3C-yA4tm9A&usqp=CAU",
//     "age": "3", 
//     "breed": "Scottish Terrier", 
//     "location": "Tooleville, West Virginia"
//   },
//   {
//     "id": 2, 
//     "name": "Melissa", 
//     "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIGZbvTeOE_9yDuRwZ9iBRJiWT9XGJcYtu0w&usqp=CAU",
//     "age": "2", 
//     "breed": "Boxer", 
//     "location": "Camas, Pennsylvania"
//   },
//   {
//     "id": 3, 
//     "name": "Coleman", 
//     "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSlIdFN1wDxTNREklDdyYZ6EHTSKO1xBu2DLQ&usqp=CAU",
//     "age": "1", 
//     "breed": "Golden Retriever", 
//     "location": "Sultana, Massach"
//   },
//   {
//     "id": 4,
//     "name": "Coleman",
//     "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSlIdFN1wDxTNREklDdyYZ6EHTSKO1xBu2DLQ&usqp=CAU",
//     "age": 1,
//     "breed": "Golden Retriever",
//     "location": "Jacksonwald, Palau"
//   },
//   {
//     "id": 5,
//     "name": "Nichole",
//     "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnVeFasfuoIk_lLZMD4uZQ3hORFUQiQnl8aA&usqp=CAU",
//     "age": 2,
//     "breed": "French Bulldog",
//     "location": "Honolulu, Hawaii"
//   },
//   {
//     "id": 6,
//     "name": "Fran",
//     "image": "data:image/jpeg;base64,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",
//     "age": 3,
//     "breed": "Boxer",
//     "location": "Matheny, Utah"
//   },
//   {
//     "id": 7,
//     "name": "Leonor",
//     "image": "data:image/jpeg;base64,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",
//     "age": 2,
//     "breed": "Boxer",
//     "location": "Tyhee, Indiana"
//   },
//   {
//     "id": 8,
//     "name": "Dean",
//     "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbPp-B47R0b0hByIa8rKTMF_716xBVJmG-Vw&usqp=CAU",
//     "age": 3,
//     "breed": "Scottish Terrier",
//     "location": "Windsor, Montana"
//   },
//   {
//     "id": 9,
//     "name": "Stevenson",
//     "image": "data:image/jpeg;base64,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",
//     "age": 3,
//     "breed": "French Bulldog",
//     "location": "Kingstowne, Nevada"
//   },
// ]
  
// document
// .querySelector("#AddData")
// .addEventListener("click", async (e) => {
//   DummyPets.forEach((_pet) => {
//     const params = [
//       _pet.name,
//       _pet.image,
//       _pet.age,
//       _pet.breed,
//       _pet.location,
//     ]
//     upload(params)
//     notification(`Adding PETS.`)
//   })
// })


// const upload = async function(params) {
//   try {
//     const result = await contract.methods
//       .createPetDetails(...params)
//       .send({ from: kit.defaultAccount })
//   } catch (error) {
//     notification(`⚠️ ${error}.`)
//   }
  
// }

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

