const contractSource = `
contract AEternityCards =

    record card =
        {   id_card       : int,
            name          : string,
            img           : string,
            attack        : int,
            health        : int,
            description   : string }


    record user =
        {   username        : string,
            card_ids        : list(int) }


    record state =
        {   users         : map(address, user),
            usersLength   : int,
            cards         : map(int, card),
            cardsLength   : int}


    function init() =
        {   users = {},
            usersLength = 0,
            cards = {[1] = { id_card = 1, name = "Coin", attack = 10, health = 10, img = "https://images.pexels.com/photos/210703/pexels-photo-210703.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260", description = "A coin"}, [2] = { id_card = 2, name = "Coffee", attack = 1, health = 1, img = "https://images.pexels.com/photos/434213/pexels-photo-434213.jpeg?auto=format%2Ccompress&cs=tinysrgb&dpr=2&h=750&w=1260", description = "Relaxing cup of coffee"}},
            cardsLength = 2}


    public function getCardsLength() : int =
        state.cardsLength


    public function getCard(index : int) : card =
        let not_found_card = { id_card = 0, name = "Not found", attack = 0, health = 0, img="Not found", description = "Card not found"}
        switch(Map.lookup(index, state.cards))
            None    => not_found_card
            Some(x) => x


    public stateful function addCard(card_ : card) =
        let index = getCardsLength() + 1
        put(state{ cards[index] = card_, cardsLength = index })


    public function getUsersLength() : int =
        state.usersLength


    public stateful function registerUser(username_ : string) =
        let address_user = Call.caller
        let user = { username = username_, card_ids = [] }
        let index = getUsersLength() + 1
        switch(Map.lookup(address_user, state.users))
            Some(x) => abort("There is a user with this address.")
            None    => put(state{ users[address_user] = user, usersLength = index })


    public function getUserAddress() : address = 
        Call.caller


    public function getCardsUser(address_user_ : address) : list(int) =
        state.users[address_user_].card_ids


    public stateful function addCardToUser(address_user_ : address, card_id_ : int) =
        let card_ids_ = card_id_ :: state.users[address_user_].card_ids
        put(state {users[address_user_].card_ids = card_ids_ })
        getCard(card_id_)


    public stateful function buyCard(card_id_ : int) : card =
        let address_user_ = Call.caller
        switch(Map.lookup(address_user_, state.users))
            Some(x) => addCardToUser(address_user_,card_id_)
            None    => abort("You are not registered.")
`;
const contractAddress = "ct_bTF5Ymqodkd35Rfci3ZHVnM7BB8zKTtQ3ui2nUFVgqbbd6mPY";
var client = null;

/*
var cardArray = [
    {"card_id": 1, "name": "Coin","img": "https://images.pexels.com/photos/210703/pexels-photo-210703.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260","attack":10, "health":10, "description":"A coin"},
    {"card_id": 2, "name": "Coffe","img": "https://images.pexels.com/photos/434213/pexels-photo-434213.jpeg?auto=format%2Ccompress&cs=tinysrgb&dpr=2&h=750&w=1260","attack":1, "health":1, "description":"Relaxing cup of coffee"}
  ];
*/

var cardArray = [];

function renderCards() {
  cardArray = cardArray.sort(function(a,b){return a.card_id-b.card_id})
  var template = $('#template').html();
  Mustache.parse(template);
  var rendered = Mustache.render(template, {cardArray});
  $('#cardBody').html(rendered);
}

//Create a asynchronous read call for our smart contract
async function callStatic(func, args) {
  //Create a new contract instance that we can interact with
  const contract = await client.getContractInstance(contractSource, {contractAddress});
  //Make a call to get data of smart contract func, with specefied arguments
  const calledGet = await contract.call(func, args, {callStatic: true}).catch(e => console.error(e));
  //Make another call to decode the data received in first call
  const decodedGet = await calledGet.decode().catch(e => console.error(e));

  return decodedGet;
}

//Create a asynchronous write call for our smart contract
async function contractCall(func, args, value) {
  const contract = await client.getContractInstance(contractSource, {contractAddress});
  //Make a call to write smart contract func, with aeon value input
  const calledSet = await contract.call(func, args, {amount: value}).catch(e => console.error(e));
  return calledSet;
}

$('#registerBtn').click(async function(){
  $("#loader").show();
  //Create two new let variables which get the values from the input fields
  const name = ($('#regUsername').val());

  //Make the contract call to register the card with the newly passed values
  await contractCall('registerUser', [name], 0);

  renderCards();
  $("#loader").hide();
});


$('#buyBtn').click(async function(){
  $("#loader").show();
  //Create two new let variables which get the values from the input fields
  const id_card = parseInt($('#card_id_number').val())

  //Make the contract call to register the card with the newly passed values
  await contractCall('buyCard', [id_card], 0);

  renderCards();
  $("#loader").hide();
});


window.addEventListener('load', async () => {
  $("#loader").show();

  cards_id = [1,1,1,1,1]

  client = await Ae.Aepp();

  address = await callStatic('getUserAddress', []);

  cards_id = await callStatic('getCardsUser', [address]);

  for (var index in cards_id) {

    //Make the call to the blockchain to get all relevant information on the card
    const card = await callStatic('getCard', [parseInt(card_id[index])]);

    //Create card object with  info from the call and push into the array with all cards
    cardArray.push({
      name: card.name,
      img: card.img,
      card_id: card.id_card,
      attack: card.attack,
      health: card.health,
      description: card.description
    })
  }

  renderCards();

  $("#loader").hide();
});
