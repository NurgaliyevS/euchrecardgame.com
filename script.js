// Euchre Game Logic

// Constants
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const VALUES = ['9', '10', 'J', 'Q', 'K', 'A'];
const SUIT_SYMBOLS = {
    'hearts': '♥',
    'diamonds': '♦',
    'clubs': '♣',
    'spades': '♠'
};

// Game state
let deck = [];
let hands = {
    'player-bottom': [],
    'player-left': [],
    'player-top': [],
    'player-right': []
};
let trumpSuit = null;
let turnOrder = ['player-bottom', 'player-left', 'player-top', 'player-right'];
let currentTurn = null;
let currentTrick = [];
let scores = {
    'player': 0,  // Player and partner (bottom and top)
    'computer': 0 // Computer team (left and right)
};
let tricksTaken = {
    'player': 0,
    'computer': 0
};
let dealer = 'player-right'; // Start with right player as dealer
let bidder = null;
let gamePhase = 'idle'; // idle, dealing, bidding, playing
let trumpCard = null;

// DOM Elements
const dealButton = document.getElementById('deal-button');
const passButton = document.getElementById('pass-button');
const orderUpButton = document.getElementById('order-up-button');
const trumpSelection = document.getElementById('trump-selection');
const trumpButtons = document.querySelectorAll('.trump-button');
const biddingControls = document.getElementById('bidding-controls');
const gameMessage = document.getElementById('game-message');
const currentTrumpDisplay = document.getElementById('current-trump');
const playerTeamScore = document.getElementById('player-team-score');
const computerTeamScore = document.getElementById('computer-team-score');
const playerHandElement = document.getElementById('player-hand');
const trumpCardElement = document.getElementById('trump-card');
const playedCardsElement = document.getElementById('played-cards');

// Event Listeners
dealButton.addEventListener('click', startNewHand);
passButton.addEventListener('click', passBid);
orderUpButton.addEventListener('click', orderUp);
trumpButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        selectTrump(e.target.dataset.suit);
    });
});

// Initialize the game
function initGame() {
    updateScoreDisplay();
    setGamePhase('idle');
}

// Create a new deck and shuffle it
function createDeck() {
    const newDeck = [];
    for (const suit of SUITS) {
        for (const value of VALUES) {
            newDeck.push({ suit, value });
        }
    }
    return shuffleDeck(newDeck);
}

// Shuffle the deck using Fisher-Yates algorithm
function shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Deal cards to players
function dealCards() {
    hands = {
        'player-bottom': [],
        'player-left': [],
        'player-top': [],
        'player-right': []
    };
    
    // In Euchre, cards are dealt in groups of 2-3-2-3
    const dealPattern = [2, 3, 2, 3];
    let currentPlayerIndex = (turnOrder.indexOf(dealer) + 1) % 4; // Start with player to the left of dealer
    
    for (let round = 0; round < 2; round++) {
        for (let i = 0; i < 4; i++) {
            const player = turnOrder[currentPlayerIndex];
            const cardCount = dealPattern[i];
            
            for (let j = 0; j < cardCount; j++) {
                hands[player].push(deck.pop());
            }
            
            currentPlayerIndex = (currentPlayerIndex + 1) % 4;
        }
    }
    
    // Turn up top card for trump consideration
    trumpCard = deck.pop();
    
    // Render all hands
    renderHands();
    renderTrumpCard();
}

// Render all player hands
function renderHands() {
    for (const player in hands) {
        const handElement = document.querySelector(`#${player} .player-cards`);
        handElement.innerHTML = '';
        
        if (player === 'player-bottom') {
            // Render player's hand face up
            hands[player].forEach((card, index) => {
                const cardElement = createCardElement(card);
                cardElement.dataset.index = index;
                cardElement.addEventListener('click', () => playCard(index));
                handElement.appendChild(cardElement);
            });
        } else {
            // Render other players' hands face down
            hands[player].forEach(() => {
                const cardElement = document.createElement('div');
                cardElement.className = 'card facedown';
                handElement.appendChild(cardElement);
            });
        }
    }
}

// Create a card element
function createCardElement(card) {
    const cardElement = document.createElement('div');
    cardElement.className = `card ${card.suit}`;
    
    const valueElement = document.createElement('div');
    valueElement.className = 'card-value';
    valueElement.textContent = card.value;
    
    const suitElement = document.createElement('div');
    suitElement.className = 'card-suit';
    suitElement.textContent = SUIT_SYMBOLS[card.suit];
    
    cardElement.appendChild(valueElement);
    cardElement.appendChild(suitElement);
    
    return cardElement;
}

// Render the trump card
function renderTrumpCard() {
    trumpCardElement.innerHTML = '';
    if (trumpCard) {
        const cardElement = createCardElement(trumpCard);
        trumpCardElement.appendChild(cardElement);
    }
}

// Start a new hand
function startNewHand() {
    // Reset game state
    deck = createDeck();
    currentTrick = [];
    tricksTaken = { 'player': 0, 'computer': 0 };
    trumpSuit = null;
    currentTrumpDisplay.textContent = 'None';
    
    // Clear the table
    playedCardsElement.innerHTML = '';
    
    // Deal cards
    setGamePhase('dealing');
    dealCards();
    
    // Move to bidding phase
    setGamePhase('bidding');
    bidder = (turnOrder.indexOf(dealer) + 1) % 4; // Bidding starts to the left of the dealer
    currentTurn = turnOrder[bidder];
    
    updateGameMessage(`Bidding starts with ${getPlayerName(currentTurn)}`);
    
    // If it's the player's turn to bid, enable bidding controls
    if (currentTurn === 'player-bottom') {
        enablePlayerBidding(true);
    } else {
        // AI bidding
        setTimeout(aiMakeBid, 1000);
    }
}

// Enable or disable player bidding controls
function enablePlayerBidding(enable) {
    biddingControls.classList.toggle('hidden', !enable);
    trumpSelection.classList.add('hidden');
}

// Pass on bidding
function passBid() {
    updateGameMessage(`${getPlayerName(currentTurn)} passes`);
    
    // Move to next bidder
    bidder = (bidder + 1) % 4;
    currentTurn = turnOrder[bidder];
    
    // If we've gone all the way around and back to the dealer
    if (currentTurn === dealer) {
        // If this is the first round of bidding, turn down the card and start second round
        if (trumpCard) {
            trumpCardElement.innerHTML = '';
            trumpCard = null;
            updateGameMessage("Trump card turned down. Second round of bidding.");
            
            // In second round, bidding starts with player to the left of dealer
            bidder = (turnOrder.indexOf(dealer) + 1) % 4;
            currentTurn = turnOrder[bidder];
            
            // Show trump selection for player
            if (currentTurn === 'player-bottom') {
                biddingControls.classList.remove('hidden');
                trumpSelection.classList.remove('hidden');
            } else {
                // AI bidding for second round
                setTimeout(aiMakeBid, 1000);
            }
        } else {
            // If this is the second round and everyone passed, redeal
            updateGameMessage("Everyone passed. Redealing...");
            setTimeout(startNewHand, 2000);
        }
    } else {
        // Continue bidding with next player
        if (currentTurn === 'player-bottom') {
            enablePlayerBidding(true);
        } else {
            // AI bidding
            setTimeout(aiMakeBid, 1000);
        }
    }
}

// Order up the trump card
function orderUp() {
    if (trumpCard) {
        // First round - ordering up the turned card
        trumpSuit = trumpCard.suit;
        updateGameMessage(`${getPlayerName(currentTurn)} orders up ${trumpCard.suit}`);
        
        // Dealer picks up the trump card and discards one
        const dealerHand = hands[dealer];
        dealerHand.push(trumpCard);
        
        if (dealer === 'player-bottom') {
            // Player needs to discard a card
            updateGameMessage("Select a card to discard");
            setGamePhase('discarding');
            renderHands();
        } else {
            // AI discards
            aiDiscard();
            startPlay();
        }
    } else {
        // Second round - show trump selection
        trumpSelection.classList.remove('hidden');
    }
}

// Select trump suit (second round)
function selectTrump(suit) {
    trumpSuit = suit;
    currentTrumpDisplay.textContent = suit.charAt(0).toUpperCase() + suit.slice(1);
    updateGameMessage(`${getPlayerName(currentTurn)} selects ${suit} as trump`);
    
    // Hide bidding controls
    biddingControls.classList.add('hidden');
    
    // Start playing
    startPlay();
}

// AI makes a bid
function aiMakeBid() {
    // Simple AI bidding logic
    const hand = hands[currentTurn];
    let shouldBid = false;
    
    if (trumpCard) {
        // First round - check if we have good cards in the turned up suit
        const trumpCardSuit = trumpCard.suit;
        const trumpCards = hand.filter(card => card.suit === trumpCardSuit);
        
        // Bid if we have 3+ cards of the trump suit or a jack of the same color
        if (trumpCards.length >= 3) {
            shouldBid = true;
        } else if (trumpCards.some(card => card.value === 'J')) {
            shouldBid = true;
        } else {
            // Check for jack of the same color (the "left bower")
            const sameSuitColor = (trumpCardSuit === 'hearts' || trumpCardSuit === 'diamonds') ? 
                ['hearts', 'diamonds'] : ['clubs', 'spades'];
            const otherSuit = sameSuitColor.find(s => s !== trumpCardSuit);
            
            if (hand.some(card => card.suit === otherSuit && card.value === 'J')) {
                shouldBid = true;
            }
        }
    } else {
        // Second round - check if we have a strong suit
        for (const suit of SUITS) {
            const suitCards = hand.filter(card => card.suit === suit);
            if (suitCards.length >= 3 && Math.random() > 0.3) {
                shouldBid = true;
                trumpSuit = suit;
                break;
            }
        }
    }
    
    if (shouldBid && Math.random() > 0.2) { // Add some randomness
        if (trumpCard) {
            updateGameMessage(`${getPlayerName(currentTurn)} orders up ${trumpCard.suit}`);
            trumpSuit = trumpCard.suit;
            currentTrumpDisplay.textContent = trumpSuit.charAt(0).toUpperCase() + trumpSuit.slice(1);
            
            // Dealer picks up the trump card
            const dealerHand = hands[dealer];
            dealerHand.push(trumpCard);
            
            // AI discards
            aiDiscard();
            startPlay();
        } else {
            // Second round - select a trump suit
            currentTrumpDisplay.textContent = trumpSuit.charAt(0).toUpperCase() + trumpSuit.slice(1);
            updateGameMessage(`${getPlayerName(currentTurn)} selects ${trumpSuit} as trump`);
            startPlay();
        }
    } else {
        passBid();
    }
}

// AI discards a card
function aiDiscard() {
    const dealerHand = hands[dealer];
    
    // Find the lowest non-trump card to discard
    let lowestCardIndex = 0;
    let lowestValue = 100;
    
    dealerHand.forEach((card, index) => {
        const cardValue = getCardValue(card, trumpSuit);
        if (cardValue < lowestValue) {
            lowestValue = cardValue;
            lowestCardIndex = index;
        }
    });
    
    // Discard the lowest card
    dealerHand.splice(lowestCardIndex, 1);
    renderHands();
}

// Start the playing phase
function startPlay() {
    setGamePhase('playing');
    
    // First player is to the left of the dealer
    currentTurn = turnOrder[(turnOrder.indexOf(dealer) + 1) % 4];
    updateGameMessage(`${getPlayerName(currentTurn)}'s turn to lead`);
    
    if (currentTurn === 'player-bottom') {
        // Enable player's cards
        enablePlayerCards(true);
    } else {
        // AI plays
        setTimeout(aiPlayCard, 1000);
    }
}

// Enable or disable player's cards
function enablePlayerCards(enable) {
    const playerCards = document.querySelectorAll('#player-hand .card');
    playerCards.forEach(card => {
        if (enable) {
            card.style.cursor = 'pointer';
        } else {
            card.style.cursor = 'default';
        }
    });
}

// Player plays a card
function playCard(index) {
    if (gamePhase === 'playing' && currentTurn === 'player-bottom') {
        const card = hands['player-bottom'][index];
        
        // Check if the card is valid to play
        if (isValidPlay(card)) {
            // Remove the card from hand
            hands['player-bottom'].splice(index, 1);
            
            // Add to current trick
            currentTrick.push({
                player: 'player-bottom',
                card: card
            });
            
            // Display the played card
            displayPlayedCard('player-bottom', card);
            
            // Move to next player
            nextTurn();
        } else {
            updateGameMessage("You must follow suit if possible!");
        }
    } else if (gamePhase === 'discarding' && currentTurn === 'player-bottom') {
        // Discard a card during the bidding phase
        hands['player-bottom'].splice(index, 1);
        renderHands();
        startPlay();
    }
}

// Check if a card is valid to play
function isValidPlay(card) {
    // If this is the first card in the trick, any card is valid
    if (currentTrick.length === 0) {
        return true;
    }
    
    // Get the led suit
    const ledSuit = currentTrick[0].card.suit;
    
    // Check if player has any cards of the led suit
    const hasSuit = hands['player-bottom'].some(c => c.suit === ledSuit);
    
    // If player has the led suit, they must play it
    if (hasSuit) {
        return card.suit === ledSuit;
    }
    
    // If player doesn't have the led suit, any card is valid
    return true;
}

// Display a played card on the table
function displayPlayedCard(player, card) {
    const cardElement = createCardElement(card);
    cardElement.classList.add('played');
    
    // Position the card based on the player
    switch (player) {
        case 'player-bottom':
            cardElement.style.bottom = '20%';
            break;
        case 'player-left':
            cardElement.style.left = '30%';
            break;
        case 'player-top':
            cardElement.style.top = '20%';
            break;
        case 'player-right':
            cardElement.style.right = '30%';
            break;
    }
    
    playedCardsElement.appendChild(cardElement);
}

// Move to the next player's turn
function nextTurn() {
    // Find the next player
    const currentIndex = turnOrder.indexOf(currentTurn);
    currentTurn = turnOrder[(currentIndex + 1) % 4];
    
    // If all players have played, evaluate the trick
    if (currentTrick.length === 4) {
        setTimeout(() => {
            evaluateTrick();
        }, 1000);
    } else {
        updateGameMessage(`${getPlayerName(currentTurn)}'s turn`);
        
        if (currentTurn === 'player-bottom') {
            enablePlayerCards(true);
        } else {
            // AI plays
            setTimeout(aiPlayCard, 1000);
        }
    }
}

// AI plays a card
function aiPlayCard() {
    const hand = hands[currentTurn];
    let cardToPlay;
    let cardIndex;
    
    if (currentTrick.length === 0) {
        // Leading the trick - play highest trump or highest card
        const trumpCards = hand.filter(card => isTrump(card, trumpSuit));
        
        if (trumpCards.length > 0 && Math.random() > 0.3) {
            // Play highest trump
            cardToPlay = trumpCards.reduce((highest, card) => 
                getCardValue(card, trumpSuit) > getCardValue(highest, trumpSuit) ? card : highest, trumpCards[0]);
        } else {
            // Play highest card
            cardToPlay = hand.reduce((highest, card) => 
                getCardValue(card, trumpSuit) > getCardValue(highest, trumpSuit) ? card : highest, hand[0]);
        }
        
        cardIndex = hand.findIndex(card => card.suit === cardToPlay.suit && card.value === cardToPlay.value);
    } else {
        // Following a trick
        const ledSuit = currentTrick[0].card.suit;
        const suitCards = hand.filter(card => card.suit === ledSuit);
        
        if (suitCards.length > 0) {
            // Must follow suit - play highest card that will win, or lowest if can't win
            const highestPlayed = currentTrick.reduce((highest, play) => {
                return getCardValue(play.card, trumpSuit) > getCardValue(highest.card, trumpSuit) ? play : highest;
            }, currentTrick[0]);
            
            const winningCards = suitCards.filter(card => 
                getCardValue(card, trumpSuit) > getCardValue(highestPlayed.card, trumpSuit));
            
            if (winningCards.length > 0) {
                // Play lowest winning card
                cardToPlay = winningCards.reduce((lowest, card) => 
                    getCardValue(card, trumpSuit) < getCardValue(lowest, trumpSuit) ? card : lowest, winningCards[0]);
            } else {
                // Can't win, play lowest card
                cardToPlay = suitCards.reduce((lowest, card) => 
                    getCardValue(card, trumpSuit) < getCardValue(lowest, trumpSuit) ? card : lowest, suitCards[0]);
            }
        } else {
            // Can't follow suit - play trump if possible, otherwise lowest card
            const trumpCards = hand.filter(card => isTrump(card, trumpSuit));
            
            if (trumpCards.length > 0 && !currentTrick.some(play => isTrump(play.card, trumpSuit))) {
                // Play lowest trump
                cardToPlay = trumpCards.reduce((lowest, card) => 
                    getCardValue(card, trumpSuit) < getCardValue(lowest, trumpSuit) ? card : lowest, trumpCards[0]);
            } else {
                // Play lowest card
                cardToPlay = hand.reduce((lowest, card) => 
                    getCardValue(card, trumpSuit) < getCardValue(lowest, trumpSuit) ? card : lowest, hand[0]);
            }
        }
        
        cardIndex = hand.findIndex(card => card.suit === cardToPlay.suit && card.value === cardToPlay.value);
    }
    
    // Remove the card from hand
    hand.splice(cardIndex, 1);
    
    // Add to current trick
    currentTrick.push({
        player: currentTurn,
        card: cardToPlay
    });
    
    // Display the played card
    displayPlayedCard(currentTurn, cardToPlay);
    
    // Update AI hand display
    renderHands();
    
    // Move to next player
    nextTurn();
}

// Evaluate who won the trick
function evaluateTrick() {
    const ledSuit = currentTrick[0].card.suit;
    let winningPlay = currentTrick[0];
    
    for (let i = 1; i < currentTrick.length; i++) {
        const play = currentTrick[i];
        const card = play.card;
        
        // Check if this card beats the current winner
        if (isTrump(card, trumpSuit) && !isTrump(winningPlay.card, trumpSuit)) {
            // Trump beats non-trump
            winningPlay = play;
        } else if (isTrump(card, trumpSuit) && isTrump(winningPlay.card, trumpSuit)) {
            // Both trump - compare values
            if (getCardValue(card, trumpSuit) > getCardValue(winningPlay.card, trumpSuit)) {
                winningPlay = play;
            }
        } else if (!isTrump(card, trumpSuit) && !isTrump(winningPlay.card, trumpSuit)) {
            // Neither is trump
            if (card.suit === ledSuit && winningPlay.card.suit === ledSuit) {
                // Both follow suit - compare values
                if (getCardValue(card, trumpSuit) > getCardValue(winningPlay.card, trumpSuit)) {
                    winningPlay = play;
                }
            } else if (card.suit === ledSuit) {
                // This card follows suit but winner doesn't
                winningPlay = play;
            }
        }
    }
    
    // Determine which team won the trick
    const winningTeam = (winningPlay.player === 'player-bottom' || winningPlay.player === 'player-top') ? 'player' : 'computer';
    tricksTaken[winningTeam]++;
    
    updateGameMessage(`${getPlayerName(winningPlay.player)} wins the trick!`);
    
    // Clear the played cards after a delay
    setTimeout(() => {
        playedCardsElement.innerHTML = '';
        
        // Check if the hand is over
        if (hands['player-bottom'].length === 0) {
            endHand();
        } else {
            // Next trick starts with the winner
            currentTurn = winningPlay.player;
            currentTrick = [];
            
            updateGameMessage(`${getPlayerName(currentTurn)}'s turn to lead`);
            
            if (currentTurn === 'player-bottom') {
                enablePlayerCards(true);
            } else {
                setTimeout(aiPlayCard, 1000);
            }
        }
    }, 1500);
}

// End the current hand and update scores
function endHand() {
    // Determine which team made the bid
    const biddingTeam = (currentTurn === 'player-bottom' || currentTurn === 'player-top') ? 'player' : 'computer';
    
    // Check if the bidding team made their bid (3+ tricks)
    if (tricksTaken[biddingTeam] >= 3) {
        // Made it
        if (tricksTaken[biddingTeam] === 5) {
            // All five tricks - march/sweep (2 points)
            scores[biddingTeam] += 2;
            updateGameMessage(`${biddingTeam === 'player' ? 'Your' : 'Computer'} team made a march! +2 points`);
        } else {
            // Regular win (1 point)
            scores[biddingTeam] += 1;
            updateGameMessage(`${biddingTeam === 'player' ? 'Your' : 'Computer'} team made it! +1 point`);
        }
    } else {
        // Euchred - defending team gets 2 points
        const defendingTeam = biddingTeam === 'player' ? 'computer' : 'player';
        scores[defendingTeam] += 2;
        updateGameMessage(`${biddingTeam === 'player' ? 'Your' : 'Computer'} team got euchred! Opponents +2 points`);
    }
    
    // Update the score display
    updateScoreDisplay();
    
    // Check for game end
    if (scores.player >= 10 || scores.computer >= 10) {
        const winner = scores.player >= 10 ? 'Your' : 'Computer';
        updateGameMessage(`${winner} team wins the game!`);
        setGamePhase('idle');
    } else {
        // Move dealer to the next player
        const dealerIndex = turnOrder.indexOf(dealer);
        dealer = turnOrder[(dealerIndex + 1) % 4];
        
        // Enable deal button for next hand
        dealButton.disabled = false;
        updateGameMessage(`Hand complete. ${getPlayerName(dealer)} will deal next. Click "Deal" to continue.`);
        setGamePhase('idle');
    }
}

// Check if a card is trump
function isTrump(card, trumpSuit) {
    if (!trumpSuit) return false;
    
    // Right bower (jack of trump suit)
    if (card.suit === trumpSuit && card.value === 'J') {
        return true;
    }
    
    // Left bower (jack of same color suit)
    if (card.value === 'J') {
        const sameSuitColor = (trumpSuit === 'hearts' || trumpSuit === 'diamonds') ? 
            ['hearts', 'diamonds'] : ['clubs', 'spades'];
        
        if (sameSuitColor.includes(card.suit) && card.suit !== trumpSuit) {
            return true;
        }
    }
    
    // Regular trump card
    return card.suit === trumpSuit;
}

// Get the relative value of a card for comparison
function getCardValue(card, trumpSuit) {
    // Base values for non-trump cards
    const baseValues = {
        '9': 9,
        '10': 10,
        'J': 11,
        'Q': 12,
        'K': 13,
        'A': 14
    };
    
    // If no trump has been selected yet
    if (!trumpSuit) {
        return baseValues[card.value];
    }
    
    // Right bower (jack of trump suit)
    if (card.suit === trumpSuit && card.value === 'J') {
        return 30; // Highest card
    }
    
    // Left bower (jack of same color suit)
    if (card.value === 'J') {
        const sameSuitColor = (trumpSuit === 'hearts' || trumpSuit === 'diamonds') ? 
            ['hearts', 'diamonds'] : ['clubs', 'spades'];
        
        if (sameSuitColor.includes(card.suit) && card.suit !== trumpSuit) {
            return 29; // Second highest card
        }
    }
    
    // Trump cards
    if (card.suit === trumpSuit) {
        return baseValues[card.value] + 15;
    }
    
    // Non-trump cards
    return baseValues[card.value];
}

// Get player name for display
function getPlayerName(playerId) {
    switch (playerId) {
        case 'player-bottom': return 'You';
        case 'player-left': return 'Left';
        case 'player-top': return 'Partner';
        case 'player-right': return 'Right';
        default: return playerId;
    }
}

// Update the game message
function updateGameMessage(message) {
    gameMessage.textContent = message;
}

// Update the score display
function updateScoreDisplay() {
    playerTeamScore.textContent = scores.player;
    computerTeamScore.textContent = scores.computer;
}

// Set the game phase
function setGamePhase(phase) {
    gamePhase = phase;
    
    // Update UI based on phase
    switch (phase) {
        case 'idle':
            dealButton.disabled = false;
            biddingControls.classList.add('hidden');
            break;
        case 'dealing':
        case 'bidding':
        case 'playing':
            dealButton.disabled = true;
            break;
    }
}

// Initialize the game when the page loads
window.addEventListener('load', initGame); 